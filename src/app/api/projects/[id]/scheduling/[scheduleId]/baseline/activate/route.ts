import { NextResponse } from 'next/server';
import { activateScheduleBaseline } from '@/lib/scheduling/scheduleWorkflow';
import { getSessionActor, checkSchedulingAccess } from '@/lib/scheduling/authUtils';
import crypto from 'crypto';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, scheduleId: string }> }) {
  try {
    const { id: projectId, scheduleId } = await params;
    const body = await req.json();
    const { expectedRowVersion, idempotencyKey } = body;

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'IDEMPOTENCY_KEY_REQUIRED' }, { status: 400 });
    }

    const actor = await getSessionActor();
    const access = await checkSchedulingAccess(actor.id, actor.role, projectId, 'canLock');

    if (!access.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const requestFingerprint = crypto.createHash('sha256').update(JSON.stringify({ 
      operation: 'activateScheduleBaseline', 
      projectId, 
      scheduleId, 
      actorId: actor.id, 
      expectedRowVersion 
    })).digest('hex');

    const result = await activateScheduleBaseline({
      projectId,
      scheduleId,
      actorId: actor.id,
      expectedRowVersion,
      idempotencyKey,
      requestFingerprint
    });

    return NextResponse.json({ success: true, schedule: result });

  } catch (error: any) {
    const msg = error.message;
    if (msg === 'SCHEDULE_VERSION_CONFLICT') {
      return NextResponse.json({ error: 'SCHEDULE_VERSION_CONFLICT' }, { status: 409 });
    }
    if (msg === 'IDEMPOTENCY_KEY_CONFLICT') {
      return NextResponse.json({ error: 'IDEMPOTENCY_KEY_CONFLICT' }, { status: 409 });
    }
    if (msg === 'SCHEDULE_ALREADY_ACTIVE') {
      return NextResponse.json({ error: 'SCHEDULE_ALREADY_ACTIVE' }, { status: 409 });
    }
    if (error.code === 'P2002') { // Prisma unique constraint
      return NextResponse.json({ error: 'IDEMPOTENCY_KEY_CONFLICT' }, { status: 409 });
    }
    console.error('Error activating baseline:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

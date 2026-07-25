import { NextResponse } from 'next/server';
import { activateScheduleBaseline, AuthorizationError } from '@/lib/services/schedule-workflow.service';
import { getSessionActor } from '@/lib/scheduling/authUtils';
import { verifyApiSession } from '@/lib/dal/auth';
import { checkUserAccess } from '@/lib/accessControl';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, scheduleId: string }> }) {
  const session = await verifyApiSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const _authParams = await params;
  const access = await checkUserAccess(session.id, _authParams.id, 'Scheduling', 'EDIT');
  if (!access.allowed) {
    return NextResponse.json({ error: access.denialReason || 'Access Denied' }, { status: 403 });
  }

  try {
    const { id: projectId, scheduleId } = await params;
    const body = await req.json();
    const { expectedRowVersion, idempotencyKey } = body;

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'IDEMPOTENCY_KEY_REQUIRED' }, { status: 400 });
    }

    const actor = await getSessionActor();

    const opSession = {
      userId: actor.id,
      email: actor.email || '',
      sessionVersion: 1, // Future integration with real session version
      accountActive: true,
      accountLocked: false,
      mustChangePassword: false,
    };

    const result = await activateScheduleBaseline(
      projectId,
      scheduleId,
      expectedRowVersion,
      idempotencyKey,
      opSession
    );

    return NextResponse.json({ success: true, schedule: result.schedule });

  } catch (error: any) {
    const msg = error.message;
    if (error.name === 'AuthorizationError' || msg.includes('Unauthorized')) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    if (msg.includes('SCHEDULE_VERSION_CONFLICT') || msg.includes('Concurrency error')) {
      return NextResponse.json({ error: 'SCHEDULE_VERSION_CONFLICT' }, { status: 409 });
    }
    if (msg.includes('IDEMPOTENCY_KEY_CONFLICT')) {
      return NextResponse.json({ error: 'IDEMPOTENCY_KEY_CONFLICT' }, { status: 409 });
    }
    if (msg.includes('SCHEDULE_ALREADY_ACTIVE')) {
      return NextResponse.json({ error: 'SCHEDULE_ALREADY_ACTIVE' }, { status: 409 });
    }
    if (error.code === 'P2002') { // Prisma unique constraint
      return NextResponse.json({ error: 'IDEMPOTENCY_KEY_CONFLICT' }, { status: 409 });
    }
    console.error('Error activating baseline:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

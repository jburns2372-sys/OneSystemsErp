import { NextResponse } from 'next/server';
import { createNewScheduleRevision } from '@/lib/scheduling/scheduleRevision';
import { getSessionActor, checkSchedulingAccess } from '@/lib/scheduling/authUtils';
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
    const { expectedRowVersion, reason } = body;

    const actor = await getSessionActor();
    const access = await checkSchedulingAccess(actor.id, actor.role, projectId, 'canRevise');

    if (!access.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const newSchedule = await createNewScheduleRevision({
      projectId,
      parentScheduleId: scheduleId,
      actorId: actor.id,
      reason,
      expectedRowVersion
    });

    return NextResponse.json({ success: true, scheduleId: newSchedule.id });

  } catch (error: any) {
    if (error.message === 'SCHEDULE_VERSION_CONFLICT') {
      return NextResponse.json({ error: 'SCHEDULE_VERSION_CONFLICT' }, { status: 409 });
    }
    console.error('Error creating revision:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

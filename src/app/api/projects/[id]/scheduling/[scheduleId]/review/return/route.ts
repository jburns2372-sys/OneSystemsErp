import { NextResponse } from 'next/server';
import { returnScheduleForRevision } from '@/lib/scheduling/scheduleWorkflow';
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
    const access = await checkSchedulingAccess(actor.id, actor.role, projectId, 'canReturnForCorrection');

    if (!access.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await returnScheduleForRevision({
      projectId,
      scheduleId,
      actorId: actor.id,
      reason,
      expectedRowVersion
    });

    return NextResponse.json({ success: true, schedule: result });

  } catch (error: any) {
    if (error.message === 'SCHEDULE_VERSION_CONFLICT') {
      return NextResponse.json({ error: 'SCHEDULE_VERSION_CONFLICT' }, { status: 409 });
    }
    console.error('Error returning for revision:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

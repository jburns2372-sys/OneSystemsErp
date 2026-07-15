import { NextResponse } from 'next/server';
import { createNewScheduleRevision } from '@/lib/scheduling/scheduleRevision';
import { getSessionActor, checkSchedulingAccess } from '@/lib/scheduling/authUtils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, scheduleId: string }> }) {
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

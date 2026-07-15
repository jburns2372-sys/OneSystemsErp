import { NextResponse } from 'next/server';
import { validateScheduleForReview } from '@/lib/scheduling/scheduleWorkflow';
import { getSessionActor, checkSchedulingAccess } from '@/lib/scheduling/authUtils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, scheduleId: string }> }) {
  try {
    const { id: projectId, scheduleId } = await params;
    const body = await req.json();
    const { expectedRowVersion } = body;

    const actor = await getSessionActor();

    // Verify project access
    const access = await checkSchedulingAccess(actor.id, actor.role, projectId);

    if (!access.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await validateScheduleForReview({
      projectId,
      scheduleId,
      actorId: actor.id,
      expectedRowVersion
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    if (error.message === 'SCHEDULE_VERSION_CONFLICT') {
      return NextResponse.json({ error: 'SCHEDULE_VERSION_CONFLICT' }, { status: 409 });
    }
    console.error('Error validating schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

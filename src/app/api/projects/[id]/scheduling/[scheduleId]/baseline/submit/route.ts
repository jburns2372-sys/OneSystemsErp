import { NextResponse } from 'next/server';
import { submitForBaselineApproval } from '@/lib/scheduling/scheduleWorkflow';
import { getSessionActor, checkSchedulingAccess } from '@/lib/scheduling/authUtils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, scheduleId: string }> }) {
  try {
    const { id: projectId, scheduleId } = await params;
    const body = await req.json();
    const { expectedRowVersion } = body;

    const actor = await getSessionActor();
    const access = await checkSchedulingAccess(actor.id, actor.role, projectId, 'canSubmit');

    if (!access.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }



    const result = await submitForBaselineApproval({
      projectId,
      scheduleId,
      actorId: actor.id,
      expectedRowVersion
    });

    return NextResponse.json({ success: true, schedule: result });

  } catch (error: any) {
    if (error.message === 'SCHEDULE_VERSION_CONFLICT') {
      return NextResponse.json({ error: 'SCHEDULE_VERSION_CONFLICT' }, { status: 409 });
    }
    console.error('Error submitting for baseline approval:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

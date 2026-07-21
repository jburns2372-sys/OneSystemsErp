import { NextResponse } from 'next/server';
import { executeTechnicalApprovalMutation } from '@/lib/services/schedule-gateway';
import { getSessionActor, checkSchedulingAccess } from '@/lib/scheduling/authUtils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, scheduleId: string }> }) {
  try {
    const { id: projectId, scheduleId } = await params;
    const body = await req.json();
    const { expectedRowVersion, comments } = body;

    const actor = await getSessionActor();
    const access = await checkSchedulingAccess(actor.id, actor.role, projectId, 'canApprove');

    if (!access.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await executeTechnicalApprovalMutation({
      projectId,
      scheduleId,
      expectedRowVersion,
      actorUserId: actor.id,
      actorRoleSnapshot: access.projectRole || actor.role,
      actorNameSnapshot: actor.name || 'Unknown',
      comments
    });

    return NextResponse.json({ success: true, schedule: result });

  } catch (error: any) {
    if (error.message === 'SCHEDULE_VERSION_CONFLICT' || error.message.includes('Concurrency')) {
      return NextResponse.json({ error: 'SCHEDULE_VERSION_CONFLICT' }, { status: 409 });
    }
    console.error('Error approving review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

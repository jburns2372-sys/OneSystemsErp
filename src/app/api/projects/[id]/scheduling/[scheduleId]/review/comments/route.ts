import { NextResponse } from 'next/server';
import { addRequiredReviewComments } from '@/lib/services/schedule-workflow.service';
import { getSessionActor, checkSchedulingAccess } from '@/lib/scheduling/authUtils';
import { prisma } from '@/lib/prisma';
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
    const { expectedRowVersion } = body;

    const actor = await getSessionActor();
    const access = await checkSchedulingAccess(actor.id, actor.role, projectId, 'canReview');
    
    if (!access.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: actor.id } });
    if (!user) throw new Error('User not found');
    const opSession = {
      userId: user.id,
      email: user.email || '',
      sessionVersion: user.sessionVersion || 1,
      accountActive: user.status === 'ACTIVE',
      accountLocked: false,
      mustChangePassword: user.mustChangePassword || false
    };

    const result = await addRequiredReviewComments(
      projectId,
      scheduleId,
      expectedRowVersion,
      opSession
    );

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    if (error.message === 'Comments already exist') {
      return NextResponse.json({ error: 'Comments already exist' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

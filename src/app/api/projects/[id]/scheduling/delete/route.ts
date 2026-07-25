import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertScheduleEditable } from '@/lib/scheduling/scheduleWorkflow';
import { verifyApiSession } from '@/lib/dal/auth';
import { checkUserAccess } from '@/lib/accessControl';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyApiSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const _authParams = await params;
  const access = await checkUserAccess(session.id, _authParams.id, 'Scheduling', 'DELETE');
  if (!access.allowed) {
    return NextResponse.json({ error: access.denialReason || 'Access Denied' }, { status: 403 });
  }

  try {
    const { id: projectId } = await params;

    const schedules = await prisma.projectSchedule.findMany({
      where: { projectId }
    });

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    for (const schedule of schedules) {
      assertScheduleEditable(schedule);
    }

    const txOperations: any[] = [];
    
    for (const schedule of schedules) {
      txOperations.push(
        prisma.scheduleDependency.deleteMany({ where: { scheduleId: schedule.id } }),
        prisma.scheduleBOQAllocation.deleteMany({ where: { scheduleId: schedule.id } }),
        prisma.scheduleActivity.deleteMany({ where: { scheduleId: schedule.id } }),
        prisma.scheduleWBS.deleteMany({ where: { scheduleId: schedule.id } }),
        prisma.scheduleMilestone.deleteMany({ where: { scheduleId: schedule.id } }),
        prisma.projectSchedule.delete({ where: { id: schedule.id } })
      );
    }
      // Set the project status back to PLANNING since schedule is wiped
      txOperations.push(
        prisma.project.update({
          where: { id: projectId },
          data: { status: 'PLANNING' }
        })
      );

    await prisma.$transaction(txOperations);

    return NextResponse.json({ success: true, message: 'Schedule successfully deleted.' });
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule.' }, { status: 500 });
  }
}

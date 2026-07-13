import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    const schedule = await prisma.projectSchedule.findUnique({
      where: { projectId }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const txOperations = [
      prisma.scheduleDependency.deleteMany({ where: { scheduleId: schedule.id } }),
      prisma.scheduleBOQMapping.deleteMany({ where: { activity: { scheduleId: schedule.id } } }),
      prisma.scheduleActivity.deleteMany({ where: { scheduleId: schedule.id } }),
      prisma.scheduleWBS.deleteMany({ where: { scheduleId: schedule.id } }),
      prisma.scheduleMilestone.deleteMany({ where: { scheduleId: schedule.id } }),
      // Set the project status back to PLANNING since schedule is wiped
      prisma.project.update({
        where: { id: projectId },
        data: { status: 'PLANNING' }
      })
    ];

    await prisma.$transaction(txOperations);

    // After deleting all children, we could delete the ProjectSchedule itself or just leave it empty.
    // The wizard expects a ProjectSchedule to exist. We will just leave it empty.
    await prisma.projectSchedule.update({
      where: { id: schedule.id },
      data: { status: 'DRAFT' }
    });

    return NextResponse.json({ success: true, message: 'Schedule successfully deleted.' });
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule.' }, { status: 500 });
  }
}

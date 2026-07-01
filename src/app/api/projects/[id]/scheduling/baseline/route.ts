import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Lock the current schedule as baseline
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    const schedule = await prisma.projectSchedule.findUnique({
      where: { projectId },
      include: { activities: true }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (schedule.status === 'BASELINE') {
      return NextResponse.json({ error: 'Schedule is already baselined' }, { status: 400 });
    }

    // Copy current planned dates to baseline fields for every activity
    const updatePromises = schedule.activities.map(activity =>
      prisma.scheduleActivity.update({
        where: { id: activity.id },
        data: {
          baselineStartDate: activity.plannedStartDate,
          baselineFinishDate: activity.plannedFinishDate
        }
      })
    );

    await Promise.all(updatePromises);

    // Lock schedule-level baseline dates and status
    await prisma.projectSchedule.update({
      where: { id: schedule.id },
      data: {
        status: 'BASELINE',
        baselineStartDate: schedule.currentStartDate,
        baselineFinishDate: schedule.currentFinishDate
      }
    });

    // Also mark the project as ACTIVE now that the schedule is locked
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'ACTIVE', startDate: new Date() }
    });

    return NextResponse.json({ success: true, message: 'Baseline locked successfully' });
  } catch (error: any) {
    console.error('Error locking baseline:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

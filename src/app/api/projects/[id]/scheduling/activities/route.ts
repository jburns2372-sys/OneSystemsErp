import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertScheduleEditable } from '@/lib/scheduling/scheduleWorkflow';

// GET: List all activities for a schedule
// POST: Create a new activity
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const schedule = await prisma.projectSchedule.findFirst({
      where: { projectId },
      include: {
        activities: {
          include: {
            wbs: true,
            assignedTo: { select: { id: true, name: true, email: true } },
            boqAllocations: { include: { awardedBoqItem: { select: { id: true, itemCode: true, description: true } } } },
            predecessors: true,
            successors: true
          },
          orderBy: { createdAt: 'asc' }
        },
        wbsNodes: { orderBy: { orderIndex: 'asc' } },
        dependencies: true
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ schedule });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();
    const { name, activityCode, description, wbsId, plannedDuration, plannedStartDate, plannedFinishDate, unit, plannedQuantity } = body;

    const schedule = await prisma.projectSchedule.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found for this project' }, { status: 404 });
    }

    assertScheduleEditable(schedule);

    const activity = await prisma.scheduleActivity.create({
      data: {
        scheduleId: schedule.id,
        name,
        activityCode: activityCode || null,
        description: description || null,
        wbsId: wbsId || null,
        plannedDuration: plannedDuration || 0,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedFinishDate: plannedFinishDate ? new Date(plannedFinishDate) : null,
        unit: unit || null,
        plannedQuantity: plannedQuantity || 0,
        status: 'NOT_STARTED'
      },
      include: {
        wbs: true,
        predecessors: true,
        successors: true
      }
    });

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertScheduleEditable } from '@/lib/scheduling/scheduleWorkflow';
import { verifyApiSession } from '@/lib/dal/auth';
import { checkUserAccess } from '@/lib/accessControl';

// PUT: Update an activity
// DELETE: Delete an activity
export async function PUT(req: Request, { params }: { params: Promise<any> }) {
  try {
    const { activityId } = await params;
    const body = await req.json();
    const { name, activityCode, description, wbsId, plannedDuration, plannedStartDate, plannedFinishDate, unit, plannedQuantity, status, priority, actualStartDate, actualFinishDate, actualProgressPercent } = body;

    const activityToUpdate = await prisma.scheduleActivity.findUnique({
      where: { id: activityId },
      include: { schedule: true }
    });
    
    if (!activityToUpdate) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    assertScheduleEditable(activityToUpdate.schedule);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (activityCode !== undefined) updateData.activityCode = activityCode;
    if (description !== undefined) updateData.description = description;
    if (wbsId !== undefined) updateData.wbsId = wbsId || null;
    if (plannedDuration !== undefined) updateData.plannedDuration = plannedDuration;
    if (plannedStartDate !== undefined) updateData.plannedStartDate = plannedStartDate ? new Date(plannedStartDate) : null;
    if (plannedFinishDate !== undefined) updateData.plannedFinishDate = plannedFinishDate ? new Date(plannedFinishDate) : null;
    if (unit !== undefined) updateData.unit = unit;
    if (plannedQuantity !== undefined) updateData.plannedQuantity = plannedQuantity;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (actualStartDate !== undefined) updateData.actualStartDate = actualStartDate ? new Date(actualStartDate) : null;
    if (actualFinishDate !== undefined) updateData.actualFinishDate = actualFinishDate ? new Date(actualFinishDate) : null;
    if (actualProgressPercent !== undefined) {
      updateData.actualProgressPercent = actualProgressPercent;
      
      // Also create a history record
      await prisma.scheduleProgressUpdate.create({
        data: {
          scheduleId: activityToUpdate.scheduleId,
          activityId: activityId,
          updateDate: new Date(),
          progressPercent: actualProgressPercent,
          remarks: 'Manual progress update from Gantt/WBS list'
        }
      });
    }

    const activity = await prisma.scheduleActivity.update({
      where: { id: activityId },
      data: updateData,
      include: {
        wbs: true,
        predecessors: true,
        successors: true
      }
    });

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; activityId: string }> }) {
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
    const { activityId } = await params;

    const activity = await prisma.scheduleActivity.findUnique({
      where: { id: activityId },
      include: { schedule: true }
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    assertScheduleEditable(activity.schedule);

    await prisma.scheduleActivity.delete({
      where: { id: activityId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

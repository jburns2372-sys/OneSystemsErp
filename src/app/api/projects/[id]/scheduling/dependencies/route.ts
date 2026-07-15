import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { wouldCreateCycle } from '@/lib/cpm-engine';
import { assertScheduleEditable } from '@/lib/scheduling/scheduleWorkflow';

// POST: Create a dependency
// DELETE: Delete a dependency (pass id in body)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();
    const { predecessorId, successorId, type, lagDays, remarks } = body;

    if (!predecessorId || !successorId) {
      return NextResponse.json({ error: 'Both predecessorId and successorId are required' }, { status: 400 });
    }

    if (predecessorId === successorId) {
      return NextResponse.json({ error: 'An activity cannot depend on itself' }, { status: 400 });
    }

    const schedule = await prisma.projectSchedule.findFirst({
      where: { projectId },
      include: {
        activities: { select: { id: true } },
        dependencies: true
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    assertScheduleEditable(schedule);

    // Check for circular dependency
    const allActivityIds = schedule.activities.map(a => a.id);
    const existingDeps = schedule.dependencies.map(d => ({
      id: d.id,
      predecessorId: d.predecessorId,
      successorId: d.successorId,
      type: d.type as 'FS' | 'SS' | 'FF' | 'SF',
      lagDays: d.lagDays
    }));

    if (wouldCreateCycle(existingDeps, predecessorId, successorId, allActivityIds)) {
      return NextResponse.json({ error: 'This dependency would create a circular reference!' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await prisma.scheduleDependency.findFirst({
      where: {
        scheduleId: schedule.id,
        predecessorId,
        successorId
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'This dependency already exists' }, { status: 400 });
    }

    const dependency = await prisma.scheduleDependency.create({
      data: {
        scheduleId: schedule.id,
        predecessorId,
        successorId,
        type: type || 'FS',
        lagDays: lagDays || 0,
        remarks: remarks || null
      }
    });

    return NextResponse.json({ success: true, dependency });
  } catch (error: any) {
    console.error('Error creating dependency:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { dependencyId } = body;

    if (!dependencyId) {
      return NextResponse.json({ error: 'dependencyId is required' }, { status: 400 });
    }

    const dependency = await prisma.scheduleDependency.findUnique({
      where: { id: dependencyId },
      include: { schedule: true }
    });

    if (!dependency) {
      return NextResponse.json({ error: 'Dependency not found' }, { status: 404 });
    }

    assertScheduleEditable(dependency.schedule);

    await prisma.scheduleDependency.delete({
      where: { id: dependencyId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting dependency:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

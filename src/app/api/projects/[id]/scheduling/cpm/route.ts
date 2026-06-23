import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCPM, resolveWorkingDayDates, type CPMActivity, type CPMDependency } from '@/lib/cpm-engine';

// POST: Run CPM calculation and update all activities with computed dates
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    const schedule = await prisma.projectSchedule.findUnique({
      where: { projectId },
      include: {
        activities: true,
        dependencies: true
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Build CPM inputs
    const cpmActivities: CPMActivity[] = schedule.activities.map(a => ({
      id: a.id,
      name: a.name,
      duration: a.plannedDuration || 1,
      plannedStart: a.plannedStartDate,
      plannedFinish: a.plannedFinishDate
    }));

    const cpmDependencies: CPMDependency[] = schedule.dependencies.map(d => ({
      id: d.id,
      predecessorId: d.predecessorId,
      successorId: d.successorId,
      type: d.type as 'FS' | 'SS' | 'FF' | 'SF',
      lagDays: d.lagDays
    }));

    // Run CPM calculation
    let cpmResult = calculateCPM(cpmActivities, cpmDependencies);

    if (cpmResult.hasCircularDependency) {
      return NextResponse.json({ error: 'Circular dependency detected', errors: cpmResult.errors }, { status: 400 });
    }

    // Resolve to calendar dates
    const projectStartDate = schedule.currentStartDate || schedule.baselineStartDate || new Date();
    const workDays = schedule.workDaysConfig ? JSON.parse(schedule.workDaysConfig) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const holidays = schedule.holidays ? JSON.parse(schedule.holidays).map((d: string) => new Date(d)) : [];

    cpmResult = resolveWorkingDayDates(cpmResult, projectStartDate, workDays, holidays);

    // Update all activities with computed dates and floats
    const updatePromises = [];
    for (const [actId, result] of cpmResult.results) {
      updatePromises.push(
        prisma.scheduleActivity.update({
          where: { id: actId },
          data: {
            plannedStartDate: result.earlyStartDate || null,
            plannedFinishDate: result.earlyFinishDate || null,
            totalFloat: result.totalFloat,
            freeFloat: result.freeFloat,
            criticalPath: result.isCritical
          }
        })
      );
    }

    await Promise.all(updatePromises);

    // Compute project-level finish date
    let maxFinishDate: Date | null = null;
    for (const result of cpmResult.results.values()) {
      if (result.earlyFinishDate && (!maxFinishDate || result.earlyFinishDate > maxFinishDate)) {
        maxFinishDate = result.earlyFinishDate;
      }
    }

    if (maxFinishDate) {
      await prisma.projectSchedule.update({
        where: { id: schedule.id },
        data: { currentFinishDate: maxFinishDate }
      });
    }

    return NextResponse.json({
      success: true,
      projectDuration: cpmResult.projectDuration,
      criticalPathCount: cpmResult.criticalPath.length,
      totalActivities: cpmActivities.length
    });
  } catch (error: any) {
    console.error('Error running CPM:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

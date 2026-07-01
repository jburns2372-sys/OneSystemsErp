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

    // ── Boundary Clamping ──
    // Fetch the project's contractual end date to enforce hard boundaries
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { originalCompletionDate: true, endDate: true } });
    const contractEndDate = project?.originalCompletionDate ? new Date(project.originalCompletionDate)
      : project?.endDate ? new Date(project.endDate) : null;

    const activityMap = new Map(schedule.activities.map(a => [a.id, a]));
    const today = new Date();

    // Update all activities with computed dates and floats
    const updatePromises = [];
    for (const [actId, result] of cpmResult.results) {
      const originalAct = activityMap.get(actId);
      
      // Clamp dates to contract boundary if they exceed it
      if (contractEndDate) {
        if (result.earlyFinishDate && result.earlyFinishDate > contractEndDate) {
          // Mark as negative float: days past the deadline
          const overrunDays = Math.ceil((result.earlyFinishDate.getTime() - contractEndDate.getTime()) / (1000 * 60 * 60 * 24));
          result.totalFloat = -overrunDays;
          result.isCritical = true;
          result.earlyFinishDate = new Date(contractEndDate);
        }
        if (result.lateFinishDate && result.lateFinishDate > contractEndDate) {
          result.lateFinishDate = new Date(contractEndDate);
        }
        if (result.earlyStartDate && result.earlyStartDate > contractEndDate) {
          result.earlyStartDate = new Date(contractEndDate);
        }
      }

      // Auto-trigger "IN_PROGRESS" status if the calculated start date has arrived
      let newStatus = originalAct?.status || 'NOT_STARTED';
      let newProgress = originalAct?.actualProgressPercent || 0;
      let newActualStart = originalAct?.actualStartDate || null;

      if (newStatus === 'NOT_STARTED') {
        const actStart = result.earlyStartDate;
        if (actStart && actStart <= today) {
          const duration = originalAct?.plannedDuration || 1;
          const lapsedDays = Math.ceil((today.getTime() - actStart.getTime()) / (1000 * 60 * 60 * 24));
          newActualStart = actStart; // Automatically set the actual start date to when it supposedly started
          if (lapsedDays >= duration) {
            newStatus = 'COMPLETED';
            newProgress = 100;
          } else {
            newStatus = 'IN_PROGRESS';
            newProgress = Math.round((lapsedDays / duration) * 100);
          }
        }
      }

      updatePromises.push(
        prisma.scheduleActivity.update({
          where: { id: actId },
          data: {
            plannedStartDate: result.earlyStartDate || null,
            plannedFinishDate: result.earlyFinishDate || null,
            totalFloat: result.totalFloat,
            freeFloat: result.freeFloat,
            criticalPath: result.isCritical,
            status: newStatus,
            actualProgressPercent: newProgress,
            actualStartDate: newActualStart
          }
        })
      );
    }

    await Promise.all(updatePromises);

    // Compute project-level finish date (capped to contract end)
    let maxFinishDate: Date | null = null;
    for (const result of cpmResult.results.values()) {
      if (result.earlyFinishDate && (!maxFinishDate || result.earlyFinishDate > maxFinishDate)) {
        maxFinishDate = result.earlyFinishDate;
      }
    }

    if (maxFinishDate) {
      if (contractEndDate && maxFinishDate > contractEndDate) {
        maxFinishDate = new Date(contractEndDate);
      }
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

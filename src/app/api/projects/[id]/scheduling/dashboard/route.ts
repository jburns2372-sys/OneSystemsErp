import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiSession } from '@/lib/dal/auth';
import { checkUserAccess } from '@/lib/accessControl';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyApiSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const _authParams = await params;
  const access = await checkUserAccess(session.id, _authParams.id, 'Scheduling', 'READ');
  if (!access.allowed) {
    return NextResponse.json({ error: access.denialReason || 'Access Denied' }, { status: 403 });
  }

  try {
    const { id: projectId } = await params;

    const schedule = await prisma.projectSchedule.findFirst({
      where: { projectId },
      include: {
        activities: true,
        progressUpdates: {
          orderBy: { updateDate: 'asc' }
        },
        delayRecords: true
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // ─── Basic KPIs ──────────────────────────────────────────────────────────
    const totalActivities = schedule.activities.length;
    const completedActivities = schedule.activities.filter(a => a.status === 'COMPLETED').length;
    const delayedActivities = schedule.activities.filter(a => a.status === 'DELAYED').length;
    const criticalActivities = schedule.activities.filter(a => a.criticalPath).length;

    // Weight is currently equal for all activities unless specified. Let's just use 1 for each.
    const overallProgress = totalActivities === 0 ? 0 : 
      schedule.activities.reduce((sum, a) => sum + (a.actualProgressPercent || 0), 0) / totalActivities;

    // ─── S-Curve Calculation (Planned vs Actual) ─────────────────────────────
    
    // Find min and max dates
    let minDate = new Date(schedule.currentStartDate || schedule.baselineStartDate || new Date());
    let maxDate = new Date(schedule.currentFinishDate || schedule.baselineFinishDate || minDate);
    
    schedule.activities.forEach(a => {
      if (a.plannedStartDate && a.plannedStartDate < minDate) minDate = a.plannedStartDate;
      if (a.plannedFinishDate && a.plannedFinishDate > maxDate) maxDate = a.plannedFinishDate;
    });

    // Add 10% buffer to ends
    minDate = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    maxDate = new Date(maxDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const sCurveData = [];
    const totalProjectWeight = totalActivities; // Assuming each activity has equal weight 1

    let current = new Date(minDate);
    const now = new Date();

    while (current <= maxDate) {
      const currentDate = new Date(current);

      // Cumulative Planned up to 'current'
      let cumPlanned = 0;
      schedule.activities.forEach(act => {
        const start = act.plannedStartDate;
        const finish = act.plannedFinishDate;
        
        if (!start || !finish) return;
        
        if (currentDate >= finish) {
          cumPlanned += 1; // fully planned
        } else if (currentDate > start) {
          // linear distribution
          const totalDays = finish.getTime() - start.getTime();
          const elapsed = currentDate.getTime() - start.getTime();
          cumPlanned += (elapsed / totalDays);
        }
      });

      const plannedPercent = totalProjectWeight > 0 ? (cumPlanned / totalProjectWeight) * 100 : 0;

      // Cumulative Actual up to 'current' (Only compute if current <= today)
      let actualPercent = null;
      if (currentDate <= now) {
        // Find latest progress updates for all activities up to 'current'
        let cumActual = 0;
        schedule.activities.forEach(act => {
          // Filter updates for this activity up to 'current'
          const updates = schedule.progressUpdates.filter(u => u.activityId === act.id && new Date(u.updateDate) <= currentDate);
          if (updates.length > 0) {
            // Get the last one
            const latest = updates[updates.length - 1];
            cumActual += (latest.progressPercent / 100);
          } else if (currentDate.getTime() === now.getTime() && act.actualProgressPercent > 0) {
            // Fallback to current actual progress if no historical updates recorded but we are at "today"
            cumActual += (act.actualProgressPercent / 100);
          }
        });
        actualPercent = totalProjectWeight > 0 ? (cumActual / totalProjectWeight) * 100 : 0;
      }

      sCurveData.push({
        date: currentDate.toISOString().split('T')[0],
        planned: parseFloat(plannedPercent.toFixed(2)),
        actual: actualPercent !== null ? parseFloat(actualPercent.toFixed(2)) : null
      });

      // advance by 1 week
      current.setDate(current.getDate() + 7);
    }

    // Schedule Performance Index (SPI)
    // SPI = Earned Value / Planned Value = Actual % / Planned % at today's date
    let spi = 1.0;
    const todayData = sCurveData.find(d => new Date(d.date) >= now) || sCurveData[sCurveData.length - 1];
    if (todayData && todayData.actual !== null && todayData.planned > 0) {
      spi = todayData.actual / todayData.planned;
    }

    return NextResponse.json({
      kpis: {
        totalActivities,
        completedActivities,
        delayedActivities,
        criticalActivities,
        overallProgress: parseFloat(overallProgress.toFixed(1)),
        spi: parseFloat(spi.toFixed(2))
      },
      sCurveData
    });

  } catch (error: any) {
    console.error('Error generating dashboard data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

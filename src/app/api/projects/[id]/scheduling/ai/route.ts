import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    const schedule = await prisma.projectSchedule.findFirst({
      where: { projectId },
      include: {
        activities: true,
        delayRecords: {
          include: { activity: true }
        }
      }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (schedule.activities.length === 0) {
      return NextResponse.json({ error: 'Schedule has no activities to analyze.' }, { status: 400 });
    }

    // Simulate AI Processing Time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // -- AI Rules Engine --
    
    let score = 100;
    const risks: string[] = [];
    const recommendations: string[] = [];

    // 1. Analyze Delays
    const unresolvedDelays = schedule.delayRecords.filter(d => d.approvalStatus !== 'APPROVED');
    const criticalDelays = schedule.delayRecords.filter(d => d.impactToCriticalPath);
    
    if (criticalDelays.length > 0) {
      score -= 20 * criticalDelays.length;
      risks.push(`CRITICAL: There are ${criticalDelays.length} reported delays that directly impact the critical path.`);
      recommendations.push('Immediate action required: Convene a risk mitigation meeting to review critical path delays.');
      recommendations.push('Consider fast-tracking or crashing subsequent critical activities to recover lost time.');
    } else if (schedule.delayRecords.length > 0) {
      score -= 5 * schedule.delayRecords.length;
      risks.push(`Moderate risk: ${schedule.delayRecords.length} non-critical delays have been reported.`);
      recommendations.push('Monitor float on delayed activities to ensure they do not become critical.');
    }

    // 2. Analyze Progress
    const totalActivities = schedule.activities.length;
    const overallProgress = schedule.activities.reduce((sum, a) => sum + (a.actualProgressPercent || 0), 0) / totalActivities;
    
    if (overallProgress < 10) {
      risks.push('Project is in early stages; historical data is insufficient for highly accurate forecasting.');
    }

    // 3. Float Analysis
    const negativeFloatCount = schedule.activities.filter(a => a.totalFloat !== null && a.totalFloat < 0).length;
    if (negativeFloatCount > 0) {
      score -= 15;
      risks.push(`SEVERE: ${negativeFloatCount} activities currently have negative float, meaning the project is mathematically guaranteed to be delayed unless the schedule is compressed.`);
      recommendations.push('Revise baseline or implement a mandatory Catch-up Plan for activities with negative float.');
    }

    const lowFloatCount = schedule.activities.filter(a => a.totalFloat !== null && a.totalFloat > 0 && a.totalFloat <= 3 && !a.criticalPath).length;
    if (lowFloatCount > 0) {
      risks.push(`Warning: ${lowFloatCount} activities have critically low float (1-3 days) and are at high risk of joining the critical path.`);
      recommendations.push('Tightly monitor resource allocation on low-float activities.');
    }

    // Cap score bounds
    score = Math.max(0, Math.min(100, Math.round(score)));

    let healthStatus = 'GOOD';
    if (score < 60) healthStatus = 'CRITICAL';
    else if (score < 80) healthStatus = 'AT RISK';

    if (risks.length === 0) {
      risks.push('No significant risks detected based on current data.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Maintain current schedule velocity.');
    }

    const aiAnalysis = {
      timestamp: new Date().toISOString(),
      score,
      healthStatus,
      summary: `Analyzed ${totalActivities} activities and ${schedule.delayRecords.length} delay reports. The project schedule health is currently **${healthStatus}** with a score of ${score}/100.`,
      risks,
      recommendations
    };

    return NextResponse.json({ success: true, analysis: aiAnalysis });
  } catch (error: any) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

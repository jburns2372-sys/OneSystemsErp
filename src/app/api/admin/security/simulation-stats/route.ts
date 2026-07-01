import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch simulation stats (pass/fail/readiness score)
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const runsToday = await prisma.securitySimulationRun.count({
      where: { startedAt: { gte: today } },
    });

    const passedRuns = await prisma.securitySimulationRun.count({
      where: { startedAt: { gte: today }, overallResult: 'Passed' },
    });

    const failedRuns = await prisma.securitySimulationRun.count({
      where: { startedAt: { gte: today }, overallResult: 'Failed' },
    });

    const allRuns = await prisma.securitySimulationRun.findMany({
      where: { status: 'COMPLETED' },
      select: { finalScore: true, detectionScore: true, responseScore: true, evidenceScore: true },
    });

    let avgFinalScore = 0;
    let avgDetectionScore = 0;
    let avgResponseScore = 0;
    let avgEvidenceScore = 0;

    if (allRuns.length > 0) {
      avgFinalScore = allRuns.reduce((sum, run) => sum + (run.finalScore || 0), 0) / allRuns.length;
      avgDetectionScore = allRuns.reduce((sum, run) => sum + (run.detectionScore || 0), 0) / allRuns.length;
      avgResponseScore = allRuns.reduce((sum, run) => sum + (run.responseScore || 0), 0) / allRuns.length;
      avgEvidenceScore = allRuns.reduce((sum, run) => sum + (run.evidenceScore || 0), 0) / allRuns.length;
    }

    return NextResponse.json({
      runsToday,
      passedRuns,
      failedRuns,
      readinessScore: avgFinalScore,
      detectionScore: avgDetectionScore,
      responseScore: avgResponseScore,
      evidenceScore: avgEvidenceScore,
    });
  } catch (error: any) {
    console.error('Error fetching simulation stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

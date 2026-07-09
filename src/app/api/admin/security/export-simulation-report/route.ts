import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const currentUser = await prisma.user.findFirst();
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const runs = await prisma.securitySimulationRun.findMany({
      include: {
        scenario: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    // Generate CSV
    const headers = [
      'Run ID',
      'Scenario Name',
      'Severity',
      'Mode',
      'Status',
      'Initiated By',
      'Start Time',
      'Detection Score',
      'Response Score',
      'Overall Result',
    ];

    const rows = runs.map(run => [
      run.id,
      run.scenario?.name || 'Unknown',
      run.scenario?.severity || 'Unknown',
      run.runMode,
      run.status,
      run.initiatedBy || 'System',
      run.startedAt.toISOString(),
      run.detectionScore || 0,
      run.responseScore || 0,
      run.overallResult || 'Pending',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="soc_simulation_report.csv"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

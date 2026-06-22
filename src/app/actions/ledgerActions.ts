'use server';

import { prisma } from '@/lib/prisma';

export async function getProjectCostLedger(projectId: string) {
  try {
    const entries = await prisma.projectCostLedger.findMany({
      where: { projectId },
      orderBy: { costDate: 'desc' }
    });

    return { success: true, data: entries };
  } catch (error: any) {
    console.error('Failed to fetch project cost ledger:', error);
    return { success: false, error: error.message };
  }
}

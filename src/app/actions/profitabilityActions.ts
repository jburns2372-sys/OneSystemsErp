'use server';

import { prisma } from '@/lib/prisma';

export async function getProjectProfitability(projectId: string) {
  try {
    // 1. Get Awarded BOQ items to calculate Contract Revenue
    const awardedItems = await prisma.awardedBOQItem.findMany({
      where: { projectId, status: 'APPROVED' }
    });
    
    // Fallback to all if none are specifically marked APPROVED (depends on your workflow)
    const activeAwardedItems = awardedItems.length > 0 
      ? awardedItems 
      : await prisma.awardedBOQItem.findMany({ where: { projectId } });

    const contractRevenue = activeAwardedItems.reduce((acc, item) => acc + item.totalCost, 0);

    // 2. Get Procurement Benchmark BOQ to calculate Target Execution Cost
    const benchmarkItems = await prisma.consolidatedBOQItem.findMany({
      where: { projectId }
    });

    const targetExecutionCost = benchmarkItems.reduce((acc, item) => acc + item.totalCost, 0);

    // 3. Get Actual Cost from ProjectCostLedger
    const costLedger = await prisma.projectCostLedger.findMany({
      where: { projectId, approvalStatus: 'APPROVED' }
    });

    const actualCostIncurred = costLedger.reduce((acc, entry) => acc + entry.netAmount, 0);

    // 4. Get Committed Cost from CommitmentLedger
    const commitmentLedger = await prisma.commitmentLedger.findMany({
      where: { projectId, status: 'ACTIVE' }
    });

    const committedCost = commitmentLedger.reduce((acc, entry) => acc + entry.remainingCommitment, 0);

    // 5. Calculate Metrics
    const targetProfit = contractRevenue - targetExecutionCost;
    const executionVariance = targetExecutionCost - actualCostIncurred;
    const realizedProfit = contractRevenue - actualCostIncurred;
    
    // Value Engineering Engine
    const totalExecutionCost = actualCostIncurred + committedCost;
    const veSavings = targetExecutionCost - totalExecutionCost;
    const isOverrun = veSavings < 0;

    const targetProfitMargin = contractRevenue > 0 ? (targetProfit / contractRevenue) * 100 : 0;
    const realizedProfitMargin = contractRevenue > 0 ? (realizedProfit / contractRevenue) * 100 : 0;

    return {
      success: true,
      data: {
        contractRevenue,
        targetExecutionCost,
        actualCostIncurred,
        committedCost,
        totalExecutionCost,
        targetProfit,
        executionVariance,
        realizedProfit,
        veSavings,
        isOverrun,
        targetProfitMargin,
        realizedProfitMargin
      }
    };

  } catch (error: any) {
    console.error('Profitability fetch error:', error);
    return { success: false, error: error.message };
  }
}

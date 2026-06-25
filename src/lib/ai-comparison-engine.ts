import { prisma } from '@/lib/prisma';

export const predefinedComparisons = [
  {
    comparisonName: 'Project Profitability',
    userQuestionPattern: '["profit", "profitability", "margin", "how much did we make"]',
    primaryModule: 'Project Management',
    primaryTable: 'Project',
    primaryField: 'contractAmount',
    comparisonLogic: 'PROFIT_CALCULATION',
  },
  {
    comparisonName: 'Procurement Variance',
    userQuestionPattern: '["budget vs actual", "over budget", "savings"]',
    primaryModule: 'Procurement',
    primaryTable: 'PurchaseOrder',
    primaryField: 'totalAmount',
    comparisonLogic: 'PROCUREMENT_VARIANCE',
  }
];

export async function seedComparisonMap() {
  for (const comp of predefinedComparisons) {
    const exists = await prisma.aiComparisonMap.findFirst({
      where: { comparisonName: comp.comparisonName }
    });
    if (!exists) {
      await prisma.aiComparisonMap.create({ data: comp });
    }
  }
}

export async function evaluateComparison(comparisonName: string, projectId?: string) {
  if (comparisonName === 'Project Profitability' && projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return null;

    const poTotal = await prisma.purchaseOrder.aggregate({ 
      _sum: { totalAmount: true },
      where: { projectId }
    });
    
    const subconTotal = await prisma.subcontractPackage.aggregate({
      _sum: { contractAmount: true },
      where: { projectId }
    });

    const expensesTotal = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { projectId }
    });

    const totalCost = (poTotal._sum.totalAmount || 0) + (subconTotal._sum.contractAmount || 0) + (expensesTotal._sum.amount || 0);
    const profit = project.contractAmount - totalCost;
    const margin = project.contractAmount > 0 ? (profit / project.contractAmount) * 100 : 0;

    return {
      project: project.name,
      contractAmount: project.contractAmount,
      totalCost,
      profit,
      marginPercent: margin.toFixed(2)
    };
  }

  return null;
}

import { prisma } from "@/lib/prisma";

export async function generateProgressBilling(
  projectId: string,
  billingPeriodFrom: Date,
  billingPeriodTo: Date,
  billingType: string,
  preparedById: string
) {
  // 1. Get Project info to calculate retentions and amounts
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error("Project not found");

  // 2. Fetch all accomplishments for this period that are approved or AI Validated
  const accomplishments = await prisma.accomplishment.findMany({
    where: {
      projectId,
      accomplishmentDate: { gte: billingPeriodFrom, lte: billingPeriodTo },
    },
    include: { items: true },
  });

  if (accomplishments.length === 0) {
    throw new Error("No accomplishments found in the selected period to bill.");
  }

  // 3. Aggregate Gross Billing Amount
  let currentBillingAmount = 0;
  for (const acc of accomplishments) {
    for (const item of acc.items) {
      currentBillingAmount += item.currentAccomplishmentAmount;
    }
  }

  // 4. Calculate previous billing total
  const pastBillings = await prisma.billing.findMany({
    where: { projectId },
  });
  const totalPreviousBilling = pastBillings.reduce((sum, b) => sum + b.currentBillingAmount, 0);

  // 5. Calculate Deductions based on Project Settings
  const retentionAmount = currentBillingAmount * ((project.retentionPercentage || 10) / 100);
  const vatAmount = project.contractAmountVATInclusive ? currentBillingAmount * (12 / 112) : currentBillingAmount * 0.12;
  const withholdingTaxAmount = currentBillingAmount * ((project.withholdingTaxPercentage || 2) / 100);
  
  // Assuming mobilization is recouped pro-rata
  const mobilizationRecoupment = (currentBillingAmount / project.contractAmount) * (project.mobilizationAdvanceAmount || 0);

  const netAmountDue = currentBillingAmount - retentionAmount - withholdingTaxAmount - mobilizationRecoupment;

  // 6. Generate Billing Record
  const newBilling = await prisma.billing.create({
    data: {
      billingNumber: `PB-${projectId.substring(0, 5)}-${pastBillings.length + 1}`,
      billingPeriodFrom,
      billingPeriodTo,
      billingDate: new Date(),
      billingType,
      contractAmount: project.contractAmount,
      revisedContractAmount: project.contractAmount, // Add variation orders logic here later
      totalPreviousBilling,
      currentBillingAmount,
      totalBillingToDate: totalPreviousBilling + currentBillingAmount,
      balanceContractAmount: project.contractAmount - (totalPreviousBilling + currentBillingAmount),
      preparedById,
      projectId,
      deductions: {
        create: {
          grossBilling: currentBillingAmount,
          retention: retentionAmount,
          withholdingTax: withholdingTaxAmount,
          vat: vatAmount,
          mobilizationAdvanceRecoupment: mobilizationRecoupment,
          netAmountDue,
        },
      },
    },
    include: { deductions: true },
  });

  return newBilling;
}

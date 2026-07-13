import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmrjd97x80001vciwqyzsvvnt';
  
  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      activities: true,
      boqAllocations: {
        include: {
          boqLine: true
        }
      },
      wbsNodes: true,
      project: true,
      lockedBOQVersion: {
        include: {
          lines: true
        }
      }
    }
  });

  if (!schedule) {
    console.log("TEST_SCHEDULE_NOT_FOUND");
    return;
  }

  // Project Record contract amount
  const projectContractAmount = new Prisma.Decimal(schedule.project?.awardedContractAmount?.toString() || "0");

  // Locked BOQ priced total
  const lockedBoqLines = schedule.lockedBOQVersion?.lines || [];
  const importedRowCount = lockedBoqLines.length;
  const pricedLines = lockedBoqLines.filter(l => l.rowType === 'DETAIL_PRICED');
  const pricedLineCount = pricedLines.length;
  const lockedBoqTotal = pricedLines.reduce(
    (sum, line) => sum.plus(new Prisma.Decimal(line.totalCost?.toString() || "0")),
    new Prisma.Decimal(0)
  );

  // Direct allocation total
  const allocations = schedule.boqAllocations;
  const allocationRecordCount = allocations.length;
  
  let nullAmountCount = 0;
  let zeroAmountCount = 0;
  let negativeAmountCount = 0;
  const uniqueAllocatedBoqLineIds = new Set<string>();

  const directAllocationTotal = allocations.reduce((sum, alloc) => {
    uniqueAllocatedBoqLineIds.add(alloc.boqLineId);
    
    if (alloc.allocatedAmount === null || alloc.allocatedAmount === undefined) {
      nullAmountCount++;
      return sum;
    }
    const val = new Prisma.Decimal(alloc.allocatedAmount.toString());
    if (val.equals(0)) zeroAmountCount++;
    if (val.isNegative()) negativeAmountCount++;
    
    return sum.plus(val);
  }, new Prisma.Decimal(0));

  // Schedule header amounts
  const headerAwarded = new Prisma.Decimal(schedule.awardedContractAmount?.toString() || "0");
  const headerScheduled = new Prisma.Decimal(schedule.scheduledAmount?.toString() || "0");
  const persistedDifference = new Prisma.Decimal(schedule.differenceAmount?.toString() || "0");

  // Independently recalculated difference
  const recalculatedDifference = directAllocationTotal.minus(lockedBoqTotal);
  
  const decimalEqualityResult = recalculatedDifference.equals(new Prisma.Decimal("0.00"));

  const disciplineGroups = pricedLines.reduce((acc, line) => {
    const d = line.discipline || 'Unknown';
    if (!acc[d]) acc[d] = new Prisma.Decimal(0);
    acc[d] = acc[d].plus(new Prisma.Decimal(line.totalCost?.toString() || "0"));
    return acc;
  }, {} as Record<string, Prisma.Decimal>);

  const expectedContract = new Prisma.Decimal("43106674.89");
  
  const passed = 
    projectContractAmount.equals(expectedContract) &&
    lockedBoqTotal.equals(expectedContract) &&
    directAllocationTotal.equals(expectedContract) &&
    headerAwarded.equals(expectedContract) &&
    headerScheduled.equals(expectedContract) &&
    persistedDifference.equals(0) &&
    recalculatedDifference.equals(0) &&
    decimalEqualityResult &&
    pricedLineCount === 326 &&
    uniqueAllocatedBoqLineIds.size === 326 &&
    nullAmountCount === 0 &&
    negativeAmountCount === 0;

  console.log("1. Schedule ID:", schedule.id);
  console.log("2. Project ID:", schedule.projectId);
  console.log("3. Schedule status:", schedule.status);
  console.log("4. Project Record contract amount:", projectContractAmount.toFixed(2));
  console.log("5. Locked BOQ total:", lockedBoqTotal.toFixed(2));
  console.log("6. Schedule header awarded amount:", headerAwarded.toFixed(2));
  console.log("7. Direct allocation total:", directAllocationTotal.toFixed(2));
  console.log("8. Schedule header scheduled amount:", headerScheduled.toFixed(2));
  console.log("9. Persisted difference:", persistedDifference.toFixed(2));
  console.log("10. Independently recalculated difference:", recalculatedDifference.toFixed(2));
  console.log("11. Decimal equality result:", decimalEqualityResult);
  console.log("12. General Requirements total:", disciplineGroups['General Requirements']?.toFixed(2) || '0.00');
  console.log("13. Mechanical Works total:", disciplineGroups['Mechanical Works']?.toFixed(2) || '0.00');
  console.log("14. Electrical Works total:", disciplineGroups['Electrical Works']?.toFixed(2) || '0.00');
  console.log("15. Imported row count:", importedRowCount);
  console.log("16. Priced-line count:", pricedLineCount);
  console.log("17. Unique allocated BOQ-line count:", uniqueAllocatedBoqLineIds.size);
  console.log("18. Allocation record count:", allocationRecordCount);
  console.log(`19. Null: ${nullAmountCount}, Zero: ${zeroAmountCount}, Negative: ${negativeAmountCount}`);
  console.log("20. Files modified, if any: None");
  console.log("21. Final result:");
  if (passed) {
    console.log("PHASE 1 PASSED");
  } else {
    console.log("PHASE 1 FAILED – FINANCIAL RECONCILIATION");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

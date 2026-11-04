-- OSERP-PROJ-UBOQ-001 Additive Migration (G01 + G01-EXC-01 + G02-R3 I-01..I-03)

-- CreateEnum
CREATE TYPE "UboqSectorType" AS ENUM ('GOVERNMENT', 'CORPORATE', 'PRIVATE');

-- CreateEnum
CREATE TYPE "UboqSnapshotStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "UboqPrrStatus" AS ENUM ('UNDER_REVIEW', 'APPROVED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "UboqTakeoffBasis" AS ENUM ('CONTRACTOR_DETAILED_DUPA', 'SUMMARY_ONLY_VERIFIED');

-- CreateEnum
CREATE TYPE "UboqResourceClass" AS ENUM ('MATERIAL', 'EQUIPMENT_SUPPLY', 'CONSUMABLE', 'LABOR_PACKAGE', 'SUBCONTRACT_SCOPE', 'TESTING_SERVICE');

-- CreateEnum
CREATE TYPE "UboqFulfillmentChannel" AS ENUM ('SUPPLIER_PO', 'WAREHOUSE_STOCK', 'SUBCONTRACT', 'PETTY_CASH_MINOR', 'DIRECT_LABOR');

-- CreateEnum
CREATE TYPE "UboqUomDimensionFamily" AS ENUM ('VOLUME', 'MASS', 'LENGTH', 'AREA', 'COUNT', 'PACK', 'TIME_LABOR', 'TIME_EQUIP', 'TEST_SET', 'LUMP_SCOPE');

-- CreateEnum
CREATE TYPE "UboqLedgerEventType" AS ENUM ('PRR_APPROVED', 'PRR_SUPERSEDED', 'OPENING_STOCK_ALLOCATED', 'MRF_RESERVE', 'MRF_RELEASE', 'PO_COMMIT_TRANSFER', 'PO_DIRECT_COMMIT', 'PO_CLOSE_SHORT', 'DELIVERY_RECEIVE', 'DELIVERY_REVERSAL', 'ISSUANCE_CONSUME', 'RETURN_GOOD_RESTORE', 'RETURN_DAMAGED_QUARANTINE');

-- AlterTable
ALTER TABLE "CanvassItem" ADD COLUMN     "canonicalResourceId" TEXT,
ADD COLUMN     "mrItemId" TEXT,
ADD COLUMN     "resourceUnit" TEXT,
ADD COLUMN     "uboqResourceRequirementId" TEXT;

-- AlterTable
ALTER TABLE "ConsolidatedBOQItem" ADD COLUMN     "isUboqResourceGoverned" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "ConsumptionItem" ADD COLUMN     "canonicalResourceId" TEXT,
ADD COLUMN     "resourceUnit" TEXT,
ADD COLUMN     "uboqResourceRequirementId" TEXT;

-- AlterTable
ALTER TABLE "DeliveryItem" ADD COLUMN     "canonicalResourceId" TEXT,
ADD COLUMN     "poItemId" TEXT,
ADD COLUMN     "resourceUnit" TEXT,
ADD COLUMN     "uboqResourceRequirementId" TEXT;

-- AlterTable
ALTER TABLE "ExpenseBreakdownItem" ADD COLUMN     "canonicalResourceId" TEXT,
ADD COLUMN     "poItemId" TEXT;

-- AlterTable
ALTER TABLE "IssuanceItem" ADD COLUMN     "canonicalResourceId" TEXT,
ADD COLUMN     "resourceUnit" TEXT,
ADD COLUMN     "stockLotEvidenceId" TEXT,
ADD COLUMN     "uboqResourceRequirementId" TEXT,
ADD COLUMN     "warehouseLocationId" TEXT;

-- AlterTable
ALTER TABLE "MaterialRequest" ADD COLUMN     "validatedSnapshotVersion" INTEGER,
ADD COLUMN     "validationPassHash" TEXT;

-- AlterTable
ALTER TABLE "MaterialRequestItem" ADD COLUMN     "canonicalResourceId" TEXT,
ADD COLUMN     "poAllocatedQty" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "resourceUnit" TEXT,
ADD COLUMN     "uboqResourceRequirementId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isSyntheticTestFixture" BOOLEAN DEFAULT false,
ADD COLUMN     "uboqGovernanceEnabled" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "ProjectCostLedger" ADD COLUMN     "canonicalResourceId" TEXT,
ADD COLUMN     "poItemId" TEXT,
ADD COLUMN     "resourceUnit" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PurchaseOrderItem" ADD COLUMN     "canonicalResourceId" TEXT,
ADD COLUMN     "canvassItemId" TEXT,
ADD COLUMN     "deliveredApprovedQty" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "mrItemId" TEXT,
ADD COLUMN     "pendingDeliveryQty" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "resourceUnit" TEXT,
ADD COLUMN     "uboqResourceRequirementId" TEXT;

-- AlterTable
ALTER TABLE "QuotationItem" ADD COLUMN     "resourceUnit" TEXT;

-- AlterTable
ALTER TABLE "ReturnItem" ADD COLUMN     "canonicalResourceId" TEXT,
ADD COLUMN     "resourceUnit" TEXT,
ADD COLUMN     "uboqResourceRequirementId" TEXT,
ADD COLUMN     "warehouseLocationId" TEXT;

-- CreateTable
CREATE TABLE "UboqSourceDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "magicSignature" TEXT NOT NULL,
    "storageUri" TEXT NOT NULL,
    "documentRole" TEXT NOT NULL DEFAULT 'CONTRACT_BOQ',
    "uploadedById" TEXT NOT NULL,
    "isLockedImmutable" BOOLEAN NOT NULL DEFAULT true,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqSourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqDocumentSection" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL DEFAULT 'WORKSHEET',
    "sheetOrPageRef" TEXT NOT NULL,
    "sectionTitle" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "layoutMetaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqDocumentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqExtractionCandidate" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "sectionId" TEXT,
    "sourceRowNumber" INTEGER,
    "sourceCellRef" TEXT,
    "rawHeadingText" TEXT,
    "mappedCanonicalId" TEXT,
    "rawValueText" TEXT,
    "rawFormulaText" TEXT,
    "parsedJson" JSONB,
    "confidenceScore" DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    "extractionMethod" TEXT NOT NULL DEFAULT 'DETERMINISTIC_PARSER',
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewDecision" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqExtractionCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqTaxPricingProfile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "profileCode" TEXT NOT NULL,
    "versionCode" TEXT NOT NULL,
    "sectorType" "UboqSectorType" NOT NULL,
    "estimateVatComponentRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "estimateVatBaseMode" TEXT NOT NULL DEFAULT 'NONE',
    "outputVatRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "salesVatCategory" TEXT NOT NULL DEFAULT 'VAT_EXEMPT',
    "contractVatInclusive" BOOLEAN NOT NULL DEFAULT true,
    "govVatWithholdingRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "ewtRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "ocmRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "contractorProfitRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "contingencyRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "retentionRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "advanceRecoupmentRate" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isImmutableApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqTaxPricingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqContractAuthority" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taxProfileId" TEXT,
    "sectorType" "UboqSectorType" NOT NULL,
    "clientName" TEXT NOT NULL,
    "contractRef" TEXT,
    "noaRef" TEXT,
    "ntpRef" TEXT,
    "clientPoRef" TEXT,
    "pricingMethod" TEXT NOT NULL DEFAULT 'UNIT_PRICE',
    "contractVatBasis" TEXT NOT NULL DEFAULT 'VAT_INCLUSIVE',
    "awardedRevenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "awardedRevenueExVat" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currentContractValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "contractDurationDays" INTEGER,
    "commencementDate" TIMESTAMP(3),
    "voReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UboqContractAuthority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqOperationalSnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "status" "UboqSnapshotStatus" NOT NULL DEFAULT 'DRAFT',
    "supersedesSnapshotId" TEXT,
    "canonicalHash" TEXT NOT NULL,
    "preparedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqOperationalSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqAwardedPhaseLine" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "awardedBoqItemId" TEXT,
    "sourceDocumentId" TEXT,
    "sourceSheetName" TEXT,
    "sourceCellRef" TEXT,
    "itemCode" TEXT NOT NULL,
    "phaseCode" TEXT NOT NULL,
    "sectionCode" TEXT,
    "workDescription" TEXT NOT NULL,
    "specification" TEXT,
    "specSignatureHash" TEXT NOT NULL,
    "unitRaw" TEXT NOT NULL,
    "unitNormalized" TEXT NOT NULL,
    "uomDimensionFamily" "UboqUomDimensionFamily" NOT NULL,
    "pricingType" TEXT NOT NULL DEFAULT 'UNIT_PRICE',
    "originalQty" DECIMAL(18,4) NOT NULL,
    "approvedQty" DECIMAL(18,4) NOT NULL,
    "contractUnitRate" DECIMAL(18,4) NOT NULL,
    "contractLineAmount" DECIMAL(18,2) NOT NULL,
    "contractAmountExVat" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UboqAwardedPhaseLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqConsolidationGroup" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "canonicalDescription" TEXT NOT NULL,
    "specification" TEXT,
    "specSignatureHash" TEXT NOT NULL,
    "unitNormalized" TEXT NOT NULL,
    "uomDimensionFamily" "UboqUomDimensionFamily" NOT NULL,
    "totalApprovedQty" DECIMAL(18,4) NOT NULL,
    "weightedUnitRate" DECIMAL(18,4) NOT NULL,
    "totalContractAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UboqConsolidationGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqConsolidationLink" (
    "id" TEXT NOT NULL,
    "consolidationGroupId" TEXT NOT NULL,
    "phaseLineId" TEXT NOT NULL,
    "allocatedQty" DECIMAL(18,4) NOT NULL,
    "allocationWeightPct" DECIMAL(9,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqConsolidationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqAgencyEstimateBaseline" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "phaseLineId" TEXT,
    "agencyEdcAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "agencyAbcAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estimateMaterialCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estimateLaborCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estimateEquipmentCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estimatedDirectCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ocmAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "contingencyOcm" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "contractorProfitAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estimateVatAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estimatedIndirectCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estimatedTotalUnitCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "estimatedTotalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqAgencyEstimateBaseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqContractorTargetBudget" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "phaseLineId" TEXT,
    "targetDirectCostAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "targetTotalCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "targetProfit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "targetMarginPct" DECIMAL(9,6) NOT NULL DEFAULT 0,
    "commitmentOpenAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "etcUncommitted" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "forecastEac" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "forecastProfit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UboqContractorTargetBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqCanonicalResourceAccount" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    "resourceCode" TEXT NOT NULL,
    "resourceDescription" TEXT NOT NULL,
    "resourceSpec" TEXT NOT NULL,
    "specSignatureHash" TEXT NOT NULL,
    "resourceClass" "UboqResourceClass" NOT NULL DEFAULT 'MATERIAL',
    "fulfillmentChannel" "UboqFulfillmentChannel" NOT NULL DEFAULT 'SUPPLIER_PO',
    "resourceUomNormalized" TEXT NOT NULL,
    "uomDimensionFamily" "UboqUomDimensionFamily" NOT NULL,
    "activeApprovedPrId" TEXT,
    "activeApprovedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "allocatedUsableStockQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "openMrReservedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "openCommittedPoQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "deliveredReceivedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "consumedIssuedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "damagedReturnedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "availablePhysicalStockQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "remainingProcurementQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "isOvercommittedByRevision" BOOLEAN NOT NULL DEFAULT false,
    "overcommittedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "targetResourceUnitCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UboqCanonicalResourceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqProcurementResourceRequirement" (
    "id" TEXT NOT NULL,
    "canonicalResourceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "consolidatedBoqItemId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "supersedesId" TEXT,
    "status" "UboqPrrStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "takeoffBasis" "UboqTakeoffBasis" NOT NULL,
    "resourceCoeff" DECIMAL(18,6),
    "workQuantityBasis" DECIMAL(18,4),
    "summaryVerifiedQty" DECIMAL(18,4),
    "requiredQty" DECIMAL(18,4) NOT NULL,
    "benchmarkUnitCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "procurementBudget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "sourceDocumentId" TEXT,
    "sourceSheetName" TEXT,
    "sourceCellRef" TEXT,
    "preparedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqProcurementResourceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqResourceWorkItemAllocation" (
    "id" TEXT NOT NULL,
    "prrId" TEXT NOT NULL,
    "phaseLineId" TEXT,
    "awardedBoqItemId" TEXT,
    "allocatedQty" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqResourceWorkItemAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqStockLotEvidence" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "canonicalResourceId" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "warehouseLocationId" TEXT NOT NULL,
    "conditionCode" TEXT NOT NULL DEFAULT 'GOOD',
    "verifiedQty" DECIMAL(18,4) NOT NULL,
    "allocatedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "issuedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "inspectionRef" TEXT NOT NULL,
    "verifiedById" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqStockLotEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqResourceLedgerEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "canonicalResourceId" TEXT NOT NULL,
    "prrSnapshotId" TEXT,
    "eventType" "UboqLedgerEventType" NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceHeaderId" TEXT NOT NULL,
    "sourceLineId" TEXT NOT NULL,
    "poItemLineageId" TEXT,
    "transitionSeq" INTEGER NOT NULL DEFAULT 1,
    "txId" TEXT NOT NULL,
    "warehouseLocationId" TEXT,
    "conditionCode" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "qtyDeltaApproved" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "qtyDeltaAllocatedStock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "qtyDeltaOpenMr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "qtyDeltaOpenPo" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "qtyDeltaDelivered" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "qtyDeltaConsumed" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "qtyDeltaDamaged" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "balanceAvailableStockAfter" DECIMAL(18,4) NOT NULL,
    "balanceRemainingProcureAfter" DECIMAL(18,4) NOT NULL,
    "unitCostSnapshot" DECIMAL(18,4),
    "actorUserId" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqResourceLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqTemplateDefinition" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "templateCode" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "rowGrain" TEXT NOT NULL,
    "selectedFieldsJson" JSONB NOT NULL,
    "headingAliasesJson" JSONB,
    "groupingRulesJson" JSONB,
    "formulaAstJson" JSONB,
    "isSystemPreset" BOOLEAN NOT NULL DEFAULT false,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UboqTemplateDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqScheduleActivityLink" (
    "id" TEXT NOT NULL,
    "phaseLineId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "allocatedQty" DECIMAL(18,4) NOT NULL,
    "allocationWeightPct" DECIMAL(9,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqScheduleActivityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqCashFlowPeriod" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "periodType" TEXT NOT NULL DEFAULT 'HALF_MONTH',
    "periodIndex" INTEGER NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "quarterLabel" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "plannedValueWeightAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "expectedBillingsAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "forecastReceiptsAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "procurementCashOutAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "payrollSubconCashOutAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "otherCashOutAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "actualCashReceiptsAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "actualCashPaidAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "closingCashAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "liquidityGapAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "roundingAdjustmentAmt" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqCashFlowPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UboqValidationException" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "ruleCode" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'BLOCKING',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "message" TEXT NOT NULL,
    "detailsJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UboqValidationException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UboqSourceDocument_projectId_createdAt_idx" ON "UboqSourceDocument"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UboqSourceDocument_projectId_sha256Hash_documentRole_key" ON "UboqSourceDocument"("projectId", "sha256Hash", "documentRole");

-- CreateIndex
CREATE INDEX "UboqDocumentSection_sourceDocumentId_displayOrder_idx" ON "UboqDocumentSection"("sourceDocumentId", "displayOrder");

-- CreateIndex
CREATE INDEX "UboqExtractionCandidate_sourceDocumentId_requiresHumanRevie_idx" ON "UboqExtractionCandidate"("sourceDocumentId", "requiresHumanReview");

-- CreateIndex
CREATE INDEX "UboqTaxPricingProfile_projectId_isImmutableApproved_idx" ON "UboqTaxPricingProfile"("projectId", "isImmutableApproved");

-- CreateIndex
CREATE UNIQUE INDEX "UboqTaxPricingProfile_projectId_profileCode_versionCode_key" ON "UboqTaxPricingProfile"("projectId", "profileCode", "versionCode");

-- CreateIndex
CREATE INDEX "UboqContractAuthority_projectId_status_idx" ON "UboqContractAuthority"("projectId", "status");

-- CreateIndex
CREATE INDEX "UboqOperationalSnapshot_projectId_status_idx" ON "UboqOperationalSnapshot"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UboqOperationalSnapshot_projectId_versionNumber_key" ON "UboqOperationalSnapshot"("projectId", "versionNumber");

-- CreateIndex
CREATE INDEX "UboqAwardedPhaseLine_projectId_phaseCode_itemCode_idx" ON "UboqAwardedPhaseLine"("projectId", "phaseCode", "itemCode");

-- CreateIndex
CREATE INDEX "UboqAwardedPhaseLine_projectId_specSignatureHash_idx" ON "UboqAwardedPhaseLine"("projectId", "specSignatureHash");

-- CreateIndex
CREATE UNIQUE INDEX "UboqConsolidationGroup_consolidatedBoqItemId_key" ON "UboqConsolidationGroup"("consolidatedBoqItemId");

-- CreateIndex
CREATE INDEX "UboqConsolidationGroup_projectId_idx" ON "UboqConsolidationGroup"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "UboqConsolidationGroup_projectId_specSignatureHash_unitNorm_key" ON "UboqConsolidationGroup"("projectId", "specSignatureHash", "unitNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "UboqConsolidationLink_consolidationGroupId_phaseLineId_key" ON "UboqConsolidationLink"("consolidationGroupId", "phaseLineId");

-- CreateIndex
CREATE INDEX "UboqAgencyEstimateBaseline_projectId_idx" ON "UboqAgencyEstimateBaseline"("projectId");

-- CreateIndex
CREATE INDEX "UboqContractorTargetBudget_projectId_idx" ON "UboqContractorTargetBudget"("projectId");

-- CreateIndex
CREATE INDEX "UboqCanonicalResourceAccount_projectId_activeApprovedPrId_idx" ON "UboqCanonicalResourceAccount"("projectId", "activeApprovedPrId");

-- CreateIndex
CREATE UNIQUE INDEX "UboqCanonicalResourceAccount_projectId_consolidatedBoqItemI_key" ON "UboqCanonicalResourceAccount"("projectId", "consolidatedBoqItemId", "specSignatureHash", "resourceUomNormalized");

-- CreateIndex
CREATE INDEX "UboqProcurementResourceRequirement_projectId_status_idx" ON "UboqProcurementResourceRequirement"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UboqProcurementResourceRequirement_canonicalResourceId_vers_key" ON "UboqProcurementResourceRequirement"("canonicalResourceId", "versionNumber");

-- CreateIndex
CREATE INDEX "UboqResourceWorkItemAllocation_prrId_idx" ON "UboqResourceWorkItemAllocation"("prrId");

-- CreateIndex
CREATE INDEX "UboqStockLotEvidence_canonicalResourceId_conditionCode_idx" ON "UboqStockLotEvidence"("canonicalResourceId", "conditionCode");

-- CreateIndex
CREATE UNIQUE INDEX "UboqStockLotEvidence_projectId_canonicalResourceId_lotNumbe_key" ON "UboqStockLotEvidence"("projectId", "canonicalResourceId", "lotNumber", "warehouseLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "UboqResourceLedgerEntry_idempotencyKey_key" ON "UboqResourceLedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "UboqResourceLedgerEntry_canonicalResourceId_createdAt_idx" ON "UboqResourceLedgerEntry"("canonicalResourceId", "createdAt");

-- CreateIndex
CREATE INDEX "UboqResourceLedgerEntry_sourceHeaderId_txId_idx" ON "UboqResourceLedgerEntry"("sourceHeaderId", "txId");

-- CreateIndex
CREATE UNIQUE INDEX "UboqResourceLedgerEntry_eventType_sourceLineId_transitionSe_key" ON "UboqResourceLedgerEntry"("eventType", "sourceLineId", "transitionSeq");

-- CreateIndex
CREATE INDEX "UboqTemplateDefinition_projectId_templateCode_idx" ON "UboqTemplateDefinition"("projectId", "templateCode");

-- CreateIndex
CREATE UNIQUE INDEX "UboqScheduleActivityLink_phaseLineId_activityId_key" ON "UboqScheduleActivityLink"("phaseLineId", "activityId");

-- CreateIndex
CREATE INDEX "UboqCashFlowPeriod_projectId_quarterLabel_idx" ON "UboqCashFlowPeriod"("projectId", "quarterLabel");

-- CreateIndex
CREATE UNIQUE INDEX "UboqCashFlowPeriod_projectId_snapshotId_periodType_periodIn_key" ON "UboqCashFlowPeriod"("projectId", "snapshotId", "periodType", "periodIndex");

-- CreateIndex
CREATE INDEX "UboqValidationException_projectId_status_severity_idx" ON "UboqValidationException"("projectId", "status", "severity");

-- CreateIndex
CREATE INDEX "CanvassItem_canonicalResourceId_idx" ON "CanvassItem"("canonicalResourceId");

-- CreateIndex
CREATE INDEX "CanvassItem_uboqResourceRequirementId_idx" ON "CanvassItem"("uboqResourceRequirementId");

-- CreateIndex
CREATE INDEX "ConsumptionItem_canonicalResourceId_idx" ON "ConsumptionItem"("canonicalResourceId");

-- CreateIndex
CREATE INDEX "ConsumptionItem_uboqResourceRequirementId_idx" ON "ConsumptionItem"("uboqResourceRequirementId");

-- CreateIndex
CREATE INDEX "DeliveryItem_poItemId_idx" ON "DeliveryItem"("poItemId");

-- CreateIndex
CREATE INDEX "DeliveryItem_canonicalResourceId_idx" ON "DeliveryItem"("canonicalResourceId");

-- CreateIndex
CREATE INDEX "DeliveryItem_uboqResourceRequirementId_idx" ON "DeliveryItem"("uboqResourceRequirementId");

-- CreateIndex
CREATE INDEX "ExpenseBreakdownItem_poItemId_idx" ON "ExpenseBreakdownItem"("poItemId");

-- CreateIndex
CREATE INDEX "ExpenseBreakdownItem_canonicalResourceId_idx" ON "ExpenseBreakdownItem"("canonicalResourceId");

-- CreateIndex
CREATE INDEX "IssuanceItem_canonicalResourceId_idx" ON "IssuanceItem"("canonicalResourceId");

-- CreateIndex
CREATE INDEX "IssuanceItem_uboqResourceRequirementId_idx" ON "IssuanceItem"("uboqResourceRequirementId");

-- CreateIndex
CREATE INDEX "MaterialRequestItem_canonicalResourceId_idx" ON "MaterialRequestItem"("canonicalResourceId");

-- CreateIndex
CREATE INDEX "MaterialRequestItem_uboqResourceRequirementId_idx" ON "MaterialRequestItem"("uboqResourceRequirementId");

-- CreateIndex
CREATE INDEX "ProjectCostLedger_poItemId_idx" ON "ProjectCostLedger"("poItemId");

-- CreateIndex
CREATE INDEX "ProjectCostLedger_canonicalResourceId_idx" ON "ProjectCostLedger"("canonicalResourceId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_canonicalResourceId_idx" ON "PurchaseOrderItem"("canonicalResourceId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_uboqResourceRequirementId_idx" ON "PurchaseOrderItem"("uboqResourceRequirementId");

-- CreateIndex
CREATE INDEX "ReturnItem_canonicalResourceId_idx" ON "ReturnItem"("canonicalResourceId");

-- CreateIndex
CREATE INDEX "ReturnItem_uboqResourceRequirementId_idx" ON "ReturnItem"("uboqResourceRequirementId");

-- AddForeignKey
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_uboqResourceRequirementId_fkey" FOREIGN KEY ("uboqResourceRequirementId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_uboqResourceRequirementId_fkey" FOREIGN KEY ("uboqResourceRequirementId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_mrItemId_fkey" FOREIGN KEY ("mrItemId") REFERENCES "MaterialRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_canvassItemId_fkey" FOREIGN KEY ("canvassItemId") REFERENCES "CanvassItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseBreakdownItem" ADD CONSTRAINT "ExpenseBreakdownItem_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseBreakdownItem" ADD CONSTRAINT "ExpenseBreakdownItem_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_uboqResourceRequirementId_fkey" FOREIGN KEY ("uboqResourceRequirementId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionItem" ADD CONSTRAINT "ConsumptionItem_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionItem" ADD CONSTRAINT "ConsumptionItem_uboqResourceRequirementId_fkey" FOREIGN KEY ("uboqResourceRequirementId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuanceItem" ADD CONSTRAINT "IssuanceItem_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuanceItem" ADD CONSTRAINT "IssuanceItem_uboqResourceRequirementId_fkey" FOREIGN KEY ("uboqResourceRequirementId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuanceItem" ADD CONSTRAINT "IssuanceItem_stockLotEvidenceId_fkey" FOREIGN KEY ("stockLotEvidenceId") REFERENCES "UboqStockLotEvidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_uboqResourceRequirementId_fkey" FOREIGN KEY ("uboqResourceRequirementId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvassItem" ADD CONSTRAINT "CanvassItem_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvassItem" ADD CONSTRAINT "CanvassItem_uboqResourceRequirementId_fkey" FOREIGN KEY ("uboqResourceRequirementId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvassItem" ADD CONSTRAINT "CanvassItem_mrItemId_fkey" FOREIGN KEY ("mrItemId") REFERENCES "MaterialRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCostLedger" ADD CONSTRAINT "ProjectCostLedger_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCostLedger" ADD CONSTRAINT "ProjectCostLedger_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqSourceDocument" ADD CONSTRAINT "UboqSourceDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqDocumentSection" ADD CONSTRAINT "UboqDocumentSection_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "UboqSourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqExtractionCandidate" ADD CONSTRAINT "UboqExtractionCandidate_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "UboqSourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqExtractionCandidate" ADD CONSTRAINT "UboqExtractionCandidate_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "UboqDocumentSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqTaxPricingProfile" ADD CONSTRAINT "UboqTaxPricingProfile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqContractAuthority" ADD CONSTRAINT "UboqContractAuthority_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqContractAuthority" ADD CONSTRAINT "UboqContractAuthority_taxProfileId_fkey" FOREIGN KEY ("taxProfileId") REFERENCES "UboqTaxPricingProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqOperationalSnapshot" ADD CONSTRAINT "UboqOperationalSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqOperationalSnapshot" ADD CONSTRAINT "UboqOperationalSnapshot_supersedesSnapshotId_fkey" FOREIGN KEY ("supersedesSnapshotId") REFERENCES "UboqOperationalSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqAwardedPhaseLine" ADD CONSTRAINT "UboqAwardedPhaseLine_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqAwardedPhaseLine" ADD CONSTRAINT "UboqAwardedPhaseLine_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "UboqOperationalSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqAwardedPhaseLine" ADD CONSTRAINT "UboqAwardedPhaseLine_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqAwardedPhaseLine" ADD CONSTRAINT "UboqAwardedPhaseLine_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "UboqSourceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqConsolidationGroup" ADD CONSTRAINT "UboqConsolidationGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqConsolidationGroup" ADD CONSTRAINT "UboqConsolidationGroup_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqConsolidationLink" ADD CONSTRAINT "UboqConsolidationLink_consolidationGroupId_fkey" FOREIGN KEY ("consolidationGroupId") REFERENCES "UboqConsolidationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqConsolidationLink" ADD CONSTRAINT "UboqConsolidationLink_phaseLineId_fkey" FOREIGN KEY ("phaseLineId") REFERENCES "UboqAwardedPhaseLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqAgencyEstimateBaseline" ADD CONSTRAINT "UboqAgencyEstimateBaseline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqAgencyEstimateBaseline" ADD CONSTRAINT "UboqAgencyEstimateBaseline_phaseLineId_fkey" FOREIGN KEY ("phaseLineId") REFERENCES "UboqAwardedPhaseLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqContractorTargetBudget" ADD CONSTRAINT "UboqContractorTargetBudget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqContractorTargetBudget" ADD CONSTRAINT "UboqContractorTargetBudget_phaseLineId_fkey" FOREIGN KEY ("phaseLineId") REFERENCES "UboqAwardedPhaseLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqCanonicalResourceAccount" ADD CONSTRAINT "UboqCanonicalResourceAccount_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqCanonicalResourceAccount" ADD CONSTRAINT "UboqCanonicalResourceAccount_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqCanonicalResourceAccount" ADD CONSTRAINT "UboqCanonicalResourceAccount_activeApprovedPrId_fkey" FOREIGN KEY ("activeApprovedPrId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqProcurementResourceRequirement" ADD CONSTRAINT "UboqProcurementResourceRequirement_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqProcurementResourceRequirement" ADD CONSTRAINT "UboqProcurementResourceRequirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqProcurementResourceRequirement" ADD CONSTRAINT "UboqProcurementResourceRequirement_consolidatedBoqItemId_fkey" FOREIGN KEY ("consolidatedBoqItemId") REFERENCES "ConsolidatedBOQItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqProcurementResourceRequirement" ADD CONSTRAINT "UboqProcurementResourceRequirement_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "UboqOperationalSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqProcurementResourceRequirement" ADD CONSTRAINT "UboqProcurementResourceRequirement_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "UboqSourceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqProcurementResourceRequirement" ADD CONSTRAINT "UboqProcurementResourceRequirement_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqResourceWorkItemAllocation" ADD CONSTRAINT "UboqResourceWorkItemAllocation_prrId_fkey" FOREIGN KEY ("prrId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqResourceWorkItemAllocation" ADD CONSTRAINT "UboqResourceWorkItemAllocation_phaseLineId_fkey" FOREIGN KEY ("phaseLineId") REFERENCES "UboqAwardedPhaseLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqResourceWorkItemAllocation" ADD CONSTRAINT "UboqResourceWorkItemAllocation_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqStockLotEvidence" ADD CONSTRAINT "UboqStockLotEvidence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqStockLotEvidence" ADD CONSTRAINT "UboqStockLotEvidence_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqResourceLedgerEntry" ADD CONSTRAINT "UboqResourceLedgerEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqResourceLedgerEntry" ADD CONSTRAINT "UboqResourceLedgerEntry_canonicalResourceId_fkey" FOREIGN KEY ("canonicalResourceId") REFERENCES "UboqCanonicalResourceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqResourceLedgerEntry" ADD CONSTRAINT "UboqResourceLedgerEntry_prrSnapshotId_fkey" FOREIGN KEY ("prrSnapshotId") REFERENCES "UboqProcurementResourceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqTemplateDefinition" ADD CONSTRAINT "UboqTemplateDefinition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqScheduleActivityLink" ADD CONSTRAINT "UboqScheduleActivityLink_phaseLineId_fkey" FOREIGN KEY ("phaseLineId") REFERENCES "UboqAwardedPhaseLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqScheduleActivityLink" ADD CONSTRAINT "UboqScheduleActivityLink_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ScheduleActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqCashFlowPeriod" ADD CONSTRAINT "UboqCashFlowPeriod_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqCashFlowPeriod" ADD CONSTRAINT "UboqCashFlowPeriod_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "UboqOperationalSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UboqValidationException" ADD CONSTRAINT "UboqValidationException_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- ============================================================================
-- OSERP-PROJ-UBOQ-001 G01-EXC-01 CHECK CONSTRAINTS, PARTIAL INDEXES, ROLES,
-- FORCE ROW LEVEL SECURITY (I-03), SECURITY DEFINER PROCEDURES & TRIGGERS (I-01, I-02)
-- ============================================================================

-- 1. Canonical Resource Account Supply & Physical Stock Invariants (R2-HIGH-01 / I-01)
ALTER TABLE "UboqCanonicalResourceAccount"
  ADD CONSTRAINT "chk_uboq_acct_nonneg" CHECK (
    "activeApprovedQty" >= 0 AND
    "allocatedUsableStockQty" >= 0 AND
    "openMrReservedQty" >= 0 AND
    "openCommittedPoQty" >= 0 AND
    "deliveredReceivedQty" >= 0 AND
    "consumedIssuedQty" >= 0 AND
    "damagedReturnedQty" >= 0 AND
    "availablePhysicalStockQty" >= 0 AND
    "remainingProcurementQty" >= 0 AND
    "overcommittedQty" >= 0
  ),
  ADD CONSTRAINT "chk_uboq_acct_physical_stock_eq" CHECK (
    ABS("availablePhysicalStockQty" - ("allocatedUsableStockQty" + "deliveredReceivedQty" - "consumedIssuedQty")) <= 0.0001
  ),
  ADD CONSTRAINT "chk_uboq_acct_supply_conservation" CHECK (
    (
      "isOvercommittedByRevision" = false AND
      "overcommittedQty" = 0 AND
      ABS("remainingProcurementQty" - ("activeApprovedQty" - ("allocatedUsableStockQty" + "openMrReservedQty" + "openCommittedPoQty" + "deliveredReceivedQty"))) <= 0.0001
    )
    OR
    (
      "isOvercommittedByRevision" = true AND
      "remainingProcurementQty" = 0 AND
      "overcommittedQty" > 0 AND
      ABS("overcommittedQty" - (("allocatedUsableStockQty" + "openMrReservedQty" + "openCommittedPoQty" + "deliveredReceivedQty") - "activeApprovedQty")) <= 0.0001
    )
  );

ALTER TABLE "UboqStockLotEvidence"
  ADD CONSTRAINT "chk_uboq_stock_lot_bounds" CHECK (
    "verifiedQty" > 0 AND "allocatedQty" >= 0 AND "issuedQty" >= 0 AND
    "allocatedQty" <= "verifiedQty" + 0.0001 AND
    "issuedQty" <= "allocatedQty" + 0.0001
  );

-- 2. Partial Indexes on Shared ERP Line Tables (Correction 2)
CREATE INDEX "idx_mri_uboq_governed" ON "MaterialRequestItem"("canonicalResourceId", "uboqResourceRequirementId") WHERE "canonicalResourceId" IS NOT NULL;
CREATE INDEX "idx_ci_uboq_governed" ON "CanvassItem"("canonicalResourceId", "uboqResourceRequirementId") WHERE "canonicalResourceId" IS NOT NULL;
CREATE INDEX "idx_poi_uboq_governed" ON "PurchaseOrderItem"("canonicalResourceId", "uboqResourceRequirementId") WHERE "canonicalResourceId" IS NOT NULL;
CREATE INDEX "idx_di_uboq_governed" ON "DeliveryItem"("canonicalResourceId", "poItemId") WHERE "canonicalResourceId" IS NOT NULL;
CREATE INDEX "idx_ii_uboq_governed" ON "IssuanceItem"("canonicalResourceId", "uboqResourceRequirementId") WHERE "canonicalResourceId" IS NOT NULL;
CREATE INDEX "idx_ri_uboq_governed" ON "ReturnItem"("canonicalResourceId", "uboqResourceRequirementId") WHERE "canonicalResourceId" IS NOT NULL;
CREATE INDEX "idx_consi_uboq_governed" ON "ConsumptionItem"("canonicalResourceId", "uboqResourceRequirementId") WHERE "canonicalResourceId" IS NOT NULL;

-- 3. PostgreSQL Database Roles & Least-Privilege Separation (RLB-CTX-04 / I-03)
DO $$
DECLARE
  v_is_local_test boolean := (current_database() LIKE '%test%' OR current_database() LIKE '%local%' OR current_database() LIKE '%uboq%');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oserp_migrations_owner') THEN
    CREATE ROLE oserp_migrations_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS;
  ELSE
    ALTER ROLE oserp_migrations_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oserp_compat_app') THEN
    IF v_is_local_test THEN
      CREATE ROLE oserp_compat_app LOGIN PASSWORD 'oserp_compat_local_only_pw' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    ELSE
      CREATE ROLE oserp_compat_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
  ELSE
    ALTER ROLE oserp_compat_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    IF v_is_local_test THEN
      ALTER ROLE oserp_compat_app LOGIN PASSWORD 'oserp_compat_local_only_pw';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oserp_legacy_app') THEN
    IF v_is_local_test THEN
      CREATE ROLE oserp_legacy_app LOGIN PASSWORD 'oserp_legacy_local_only_pw' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    ELSE
      CREATE ROLE oserp_legacy_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
  ELSE
    ALTER ROLE oserp_legacy_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    IF v_is_local_test THEN
      ALTER ROLE oserp_legacy_app LOGIN PASSWORD 'oserp_legacy_local_only_pw';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oserp_maint_cleanup_role') THEN
    IF v_is_local_test THEN
      CREATE ROLE oserp_maint_cleanup_role LOGIN PASSWORD 'oserp_maint_local_only_pw' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    ELSE
      CREATE ROLE oserp_maint_cleanup_role NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    END IF;
  ELSE
    ALTER ROLE oserp_maint_cleanup_role NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    IF v_is_local_test THEN
      ALTER ROLE oserp_maint_cleanup_role LOGIN PASSWORD 'oserp_maint_local_only_pw';
    END IF;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO oserp_migrations_owner, oserp_compat_app, oserp_legacy_app, oserp_maint_cleanup_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO oserp_migrations_owner, oserp_compat_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO oserp_legacy_app;
GRANT SELECT ON "Project", "UboqOperationalSnapshot", "UboqResourceLedgerEntry" TO oserp_maint_cleanup_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO oserp_migrations_owner, oserp_compat_app, oserp_legacy_app;

-- Explicitly revoke direct access to all Uboq* tables from oserp_legacy_app
REVOKE ALL ON
  "UboqSourceDocument",
  "UboqDocumentSection",
  "UboqExtractionCandidate",
  "UboqTaxPricingProfile",
  "UboqContractAuthority",
  "UboqOperationalSnapshot",
  "UboqAwardedPhaseLine",
  "UboqConsolidationGroup",
  "UboqConsolidationLink",
  "UboqAgencyEstimateBaseline",
  "UboqContractorTargetBudget",
  "UboqCanonicalResourceAccount",
  "UboqProcurementResourceRequirement",
  "UboqResourceWorkItemAllocation",
  "UboqStockLotEvidence",
  "UboqResourceLedgerEntry",
  "UboqTemplateDefinition",
  "UboqScheduleActivityLink",
  "UboqCashFlowPeriod",
  "UboqValidationException"
FROM oserp_legacy_app;

-- 4. SECURITY DEFINER Project-Resolution & Governance Helpers (I-03 Safe FK Resolution)
CREATE OR REPLACE FUNCTION uboq_is_governed_project(p_project_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_project_id IS NULL THEN false
    ELSE (
      EXISTS (
        SELECT 1 FROM "Project" p
        WHERE p.id = p_project_id AND COALESCE(p."uboqGovernanceEnabled", false) = true
      )
      OR EXISTS (
        SELECT 1 FROM "ConsolidatedBOQItem" c
        WHERE c."projectId" = p_project_id AND COALESCE(c."isUboqResourceGoverned", false) = true
      )
    )
  END;
$$;
ALTER FUNCTION uboq_is_governed_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_mr_project(p_mr_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT "projectId" FROM "MaterialRequest" WHERE id = p_mr_id;
$$;
ALTER FUNCTION uboq_resolve_mr_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_canvass_project(p_canvass_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT "projectId" FROM "CanvassForm" WHERE id = p_canvass_id;
$$;
ALTER FUNCTION uboq_resolve_canvass_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_po_project(p_mr_id text, p_canvass_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT "projectId" FROM "MaterialRequest" WHERE id = p_mr_id),
    (SELECT "projectId" FROM "CanvassForm" WHERE id = p_canvass_id)
  );
$$;
ALTER FUNCTION uboq_resolve_po_project(text, text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_po_id_project(p_po_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(mr."projectId", cf."projectId")
  FROM "PurchaseOrder" po
  LEFT JOIN "MaterialRequest" mr ON mr.id = po."mrId"
  LEFT JOIN "CanvassForm" cf ON cf.id = po."canvassFormId"
  WHERE po.id = p_po_id;
$$;
ALTER FUNCTION uboq_resolve_po_id_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_delivery_project(p_delivery_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT uboq_resolve_po_id_project(d."poId")
  FROM "Delivery" d
  WHERE d.id = p_delivery_id;
$$;
ALTER FUNCTION uboq_resolve_delivery_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_issuance_project(p_issuance_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT "projectId" FROM "MaterialIssuance" WHERE id = p_issuance_id;
$$;
ALTER FUNCTION uboq_resolve_issuance_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_return_project(p_return_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT "projectId" FROM "MaterialReturn" WHERE id = p_return_id;
$$;
ALTER FUNCTION uboq_resolve_return_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_consumption_project(p_log_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT "projectId" FROM "ConsumptionLog" WHERE id = p_log_id;
$$;
ALTER FUNCTION uboq_resolve_consumption_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_expense_project(p_expense_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT "projectId" FROM "Expense" WHERE id = p_expense_id;
$$;
ALTER FUNCTION uboq_resolve_expense_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_source_doc_project(p_doc_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT "projectId" FROM "UboqSourceDocument" WHERE id = p_doc_id;
$$;
ALTER FUNCTION uboq_resolve_source_doc_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_cons_group_project(p_group_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT "projectId" FROM "UboqConsolidationGroup" WHERE id = p_group_id;
$$;
ALTER FUNCTION uboq_resolve_cons_group_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_prr_project(p_prr_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT "projectId" FROM "UboqProcurementResourceRequirement" WHERE id = p_prr_id;
$$;
ALTER FUNCTION uboq_resolve_prr_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_resolve_phase_line_project(p_line_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT "projectId" FROM "UboqAwardedPhaseLine" WHERE id = p_line_id;
$$;
ALTER FUNCTION uboq_resolve_phase_line_project(text) OWNER TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION uboq_check_tenant_rls(p_project_id text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN current_user IN ('oserp_compat_app', 'oserp_legacy_app')
         OR COALESCE(current_setting('app.enforce_project_rls', true), 'off') = 'on'
    THEN (
      CASE
        WHEN COALESCE(current_setting('app.current_user_global_admin', true), 'false') = 'true'
             OR UPPER(COALESCE(current_setting('app.current_user_role', true), '')) IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'PRESIDENT', 'VP_OPERATIONS')
        THEN true
        ELSE (p_project_id IS NOT NULL AND p_project_id = NULLIF(current_setting('app.current_project_id', true), ''))
      END
    )
    ELSE true
  END;
$$;
ALTER FUNCTION uboq_check_tenant_rls(text) OWNER TO oserp_migrations_owner;

-- 5. ENABLE + FORCE ROW LEVEL SECURITY (PERMISSIVE + RESTRICTIVE Policies, I-03)
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('Project', 'id'),
      ('ConsolidatedBOQItem', '"projectId"'),
      ('MaterialRequest', '"projectId"'),
      ('MaterialRequestItem', 'uboq_resolve_mr_project("mrId")'),
      ('CanvassForm', '"projectId"'),
      ('CanvassItem', 'uboq_resolve_canvass_project("canvassFormId")'),
      ('PurchaseOrder', 'uboq_resolve_po_project("mrId", "canvassFormId")'),
      ('PurchaseOrderItem', 'uboq_resolve_po_id_project("poId")'),
      ('Delivery', 'uboq_resolve_po_id_project("poId")'),
      ('DeliveryItem', 'uboq_resolve_delivery_project("deliveryId")'),
      ('MaterialIssuance', '"projectId"'),
      ('IssuanceItem', 'uboq_resolve_issuance_project("issuanceId")'),
      ('MaterialReturn', '"projectId"'),
      ('ReturnItem', 'uboq_resolve_return_project("returnId")'),
      ('ConsumptionLog', '"projectId"'),
      ('ConsumptionItem', 'uboq_resolve_consumption_project("logId")'),
      ('AccountsPayable', 'uboq_resolve_po_id_project("poId")'),
      ('ProjectCostLedger', '"projectId"'),
      ('Expense', '"projectId"'),
      ('ExpenseBreakdownItem', 'uboq_resolve_expense_project("expenseId")')
    ) AS t(tbl, proj_expr)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', rec.tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', rec.tbl);

    EXECUTE format(
      'CREATE POLICY rls_permissive_app_access ON %I AS PERMISSIVE FOR ALL TO PUBLIC USING (true) WITH CHECK (true)',
      rec.tbl
    );

    EXECUTE format(
      'CREATE POLICY rls_restrictive_tenant_scope ON %I AS RESTRICTIVE FOR ALL TO PUBLIC USING (uboq_check_tenant_rls(%s)) WITH CHECK (uboq_check_tenant_rls(%s))',
      rec.tbl, rec.proj_expr, rec.proj_expr
    );

    EXECUTE format(
      'CREATE POLICY rls_block_legacy_role_on_uboq ON %I AS RESTRICTIVE FOR ALL TO oserp_legacy_app USING (NOT uboq_is_governed_project(%s)) WITH CHECK (NOT uboq_is_governed_project(%s))',
      rec.tbl, rec.proj_expr, rec.proj_expr
    );
  END LOOP;

  -- Also enforce RLS tenant isolation on Uboq* project-scoped tables
  FOR rec IN
    SELECT * FROM (VALUES
      ('UboqSourceDocument'),
      ('UboqTaxPricingProfile'),
      ('UboqContractAuthority'),
      ('UboqOperationalSnapshot'),
      ('UboqAwardedPhaseLine'),
      ('UboqConsolidationGroup'),
      ('UboqAgencyEstimateBaseline'),
      ('UboqContractorTargetBudget'),
      ('UboqCanonicalResourceAccount'),
      ('UboqProcurementResourceRequirement'),
      ('UboqStockLotEvidence'),
      ('UboqResourceLedgerEntry'),
      ('UboqCashFlowPeriod'),
      ('UboqValidationException')
    ) AS u(tbl)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', rec.tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', rec.tbl);
    EXECUTE format(
      'CREATE POLICY rls_permissive_uboq_access ON %I AS PERMISSIVE FOR ALL TO PUBLIC USING (true) WITH CHECK (true)',
      rec.tbl
    );
    EXECUTE format(
      'CREATE POLICY rls_restrictive_uboq_tenant_scope ON %I AS RESTRICTIVE FOR ALL TO PUBLIC USING (uboq_check_tenant_rls("projectId")) WITH CHECK (uboq_check_tenant_rls("projectId"))',
      rec.tbl
    );
    EXECUTE format(
      'CREATE POLICY rls_deny_legacy_on_uboq_native ON %I AS RESTRICTIVE FOR ALL TO oserp_legacy_app USING (false) WITH CHECK (false)',
      rec.tbl
    );
  END LOOP;

  -- Enforce RLS tenant isolation on FK-joined Uboq* child tables & UboqTemplateDefinition
  FOR rec IN
    SELECT * FROM (VALUES
      ('UboqDocumentSection', 'uboq_resolve_source_doc_project("sourceDocumentId")'),
      ('UboqExtractionCandidate', 'uboq_resolve_source_doc_project("sourceDocumentId")'),
      ('UboqConsolidationLink', 'uboq_resolve_cons_group_project("consolidationGroupId")'),
      ('UboqResourceWorkItemAllocation', 'uboq_resolve_prr_project("prrId")'),
      ('UboqScheduleActivityLink', 'uboq_resolve_phase_line_project("phaseLineId")')
    ) AS uc(tbl, proj_expr)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', rec.tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', rec.tbl);
    EXECUTE format(
      'CREATE POLICY rls_permissive_uboq_child_access ON %I AS PERMISSIVE FOR ALL TO PUBLIC USING (true) WITH CHECK (true)',
      rec.tbl
    );
    EXECUTE format(
      'CREATE POLICY rls_restrictive_uboq_child_tenant ON %I AS RESTRICTIVE FOR ALL TO PUBLIC USING (uboq_check_tenant_rls(%s)) WITH CHECK (uboq_check_tenant_rls(%s))',
      rec.tbl, rec.proj_expr, rec.proj_expr
    );
    EXECUTE format(
      'CREATE POLICY rls_deny_legacy_on_uboq_child ON %I AS RESTRICTIVE FOR ALL TO oserp_legacy_app USING (false) WITH CHECK (false)',
      rec.tbl
    );
  END LOOP;

  ALTER TABLE "UboqTemplateDefinition" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "UboqTemplateDefinition" FORCE ROW LEVEL SECURITY;
  CREATE POLICY rls_permissive_uboq_tpl_access ON "UboqTemplateDefinition" AS PERMISSIVE FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
  CREATE POLICY rls_restrictive_uboq_tpl_tenant ON "UboqTemplateDefinition" AS RESTRICTIVE FOR ALL TO PUBLIC
    USING (("isSystemPreset" = true AND "projectId" IS NULL) OR uboq_check_tenant_rls("projectId"))
    WITH CHECK (("isSystemPreset" = true AND "projectId" IS NULL) OR uboq_check_tenant_rls("projectId"));
  CREATE POLICY rls_deny_legacy_on_uboq_tpl ON "UboqTemplateDefinition" AS RESTRICTIVE FOR ALL TO oserp_legacy_app USING (false) WITH CHECK (false);
END $$;

-- 6. SECURITY DEFINER Controlled Snapshot Sync & Verified Synthetic Cleanup Procedures
CREATE OR REPLACE FUNCTION uboq_sync_consolidated_snapshot(
  p_consolidated_id text,
  p_quantity double precision,
  p_revised_quantity double precision,
  p_unit_cost double precision,
  p_total_cost double precision,
  p_is_governed boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF session_user = 'oserp_legacy_app' THEN
    RAISE EXCEPTION 'UBOQ_LEGACY_ROLE_DENIED: oserp_legacy_app cannot sync UBOQ snapshots';
  END IF;
  PERFORM set_config('app.uboq_snapshot_sync', 'on', true);
  UPDATE "ConsolidatedBOQItem"
  SET
    "quantity" = p_quantity,
    "revisedQuantity" = p_revised_quantity,
    "unitCost" = p_unit_cost,
    "totalCost" = p_total_cost,
    "revisedTotalCost" = p_total_cost,
    "isUboqResourceGoverned" = p_is_governed,
    "updatedAt" = NOW()
  WHERE id = p_consolidated_id;
  PERFORM set_config('app.uboq_snapshot_sync', 'off', true);
END;
$$;
ALTER FUNCTION uboq_sync_consolidated_snapshot(text, double precision, double precision, double precision, double precision, boolean) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION uboq_sync_consolidated_snapshot(text, double precision, double precision, double precision, double precision, boolean) FROM PUBLIC, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION uboq_sync_consolidated_snapshot(text, double precision, double precision, double precision, double precision, boolean) TO oserp_compat_app;

CREATE OR REPLACE FUNCTION uboq_execute_verified_synthetic_cleanup(p_project_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_synth boolean;
  v_deleted_ledger int := 0;
BEGIN
  -- Enforce role-based cleanup separation (RLB-CTX-04 / I-03)
  IF session_user <> 'oserp_maint_cleanup_role' AND NOT (SELECT rolsuper FROM pg_roles WHERE rolname = session_user) THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_ROLE_DENIED: Only oserp_maint_cleanup_role may execute synthetic cleanup (session_user=%)', session_user
      USING ERRCODE = '42501';
  END IF;

  IF p_project_id IS NULL OR p_project_id !~ '^SYNTH-UBOQ-TEST-' THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_PREFIX_REJECTED: Project id % does not match ^SYNTH-UBOQ-TEST- namespace', p_project_id
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE("isSyntheticTestFixture", false)
  INTO v_is_synth
  FROM "Project"
  WHERE id = p_project_id;

  IF v_is_synth IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'UBOQ_CLEANUP_NOT_SYNTHETIC: Project % is missing isSyntheticTestFixture=true', p_project_id
      USING ERRCODE = 'P0001';
  END IF;

  PERFORM set_config('app.synthetic_cleanup_authorized', 'on', true);

  DELETE FROM "ExpenseBreakdownItem" WHERE "expenseId" IN (SELECT id FROM "Expense" WHERE "projectId" = p_project_id);
  DELETE FROM "Expense" WHERE "projectId" = p_project_id;
  DELETE FROM "ProjectCostLedger" WHERE "projectId" = p_project_id;
  DELETE FROM "CommitmentLedger" WHERE "projectId" = p_project_id;
  DELETE FROM "AccountsPayable" WHERE "poId" IN (
    SELECT po.id FROM "PurchaseOrder" po
    WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = p_project_id
  );
  DELETE FROM "ReturnItem" WHERE "returnId" IN (SELECT id FROM "MaterialReturn" WHERE "projectId" = p_project_id);
  DELETE FROM "MaterialReturn" WHERE "projectId" = p_project_id;
  DELETE FROM "IssuanceItem" WHERE "issuanceId" IN (SELECT id FROM "MaterialIssuance" WHERE "projectId" = p_project_id);
  DELETE FROM "MaterialIssuance" WHERE "projectId" = p_project_id;
  DELETE FROM "ConsumptionItem" WHERE "logId" IN (SELECT id FROM "ConsumptionLog" WHERE "projectId" = p_project_id);
  DELETE FROM "ConsumptionLog" WHERE "projectId" = p_project_id;
  DELETE FROM "DeliveryItem" WHERE "deliveryId" IN (
    SELECT d.id FROM "Delivery" d
    JOIN "PurchaseOrder" po ON po.id = d."poId"
    WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = p_project_id
  );
  DELETE FROM "Delivery" WHERE "poId" IN (
    SELECT po.id FROM "PurchaseOrder" po
    WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = p_project_id
  );
  DELETE FROM "PurchaseOrderItem" WHERE "poId" IN (
    SELECT po.id FROM "PurchaseOrder" po
    WHERE uboq_resolve_po_project(po."mrId", po."canvassFormId") = p_project_id
  );
  DELETE FROM "PurchaseOrder" WHERE uboq_resolve_po_project("mrId", "canvassFormId") = p_project_id;
  DELETE FROM "VariationOrder" WHERE "projectId" = p_project_id;
  DELETE FROM "Accomplishment" WHERE "projectId" = p_project_id;
  DELETE FROM "Billing" WHERE "projectId" = p_project_id;
  DELETE FROM "Document" WHERE "projectId" = p_project_id;
  DELETE FROM "QuotationItem" WHERE "canvassItemId" IN (
    SELECT ci.id FROM "CanvassItem" ci
    JOIN "CanvassForm" cf ON cf.id = ci."canvassFormId"
    WHERE cf."projectId" = p_project_id
  );
  DELETE FROM "SupplierQuotation" WHERE "canvassFormId" IN (SELECT id FROM "CanvassForm" WHERE "projectId" = p_project_id);
  DELETE FROM "CanvassItem" WHERE "canvassFormId" IN (SELECT id FROM "CanvassForm" WHERE "projectId" = p_project_id);
  DELETE FROM "CanvassForm" WHERE "projectId" = p_project_id;
  DELETE FROM "MaterialRequestItem" WHERE "mrId" IN (SELECT id FROM "MaterialRequest" WHERE "projectId" = p_project_id);
  DELETE FROM "MaterialRequest" WHERE "projectId" = p_project_id;

  DELETE FROM "UboqResourceLedgerEntry" WHERE "projectId" = p_project_id;
  GET DIAGNOSTICS v_deleted_ledger = ROW_COUNT;
  DELETE FROM "UboqStockLotEvidence" WHERE "projectId" = p_project_id;
  UPDATE "UboqCanonicalResourceAccount" SET "activeApprovedPrId" = NULL WHERE "projectId" = p_project_id;
  UPDATE "UboqProcurementResourceRequirement" SET "supersedesId" = NULL WHERE "projectId" = p_project_id;
  DELETE FROM "UboqResourceWorkItemAllocation" WHERE "prrId" IN (
    SELECT id FROM "UboqProcurementResourceRequirement" WHERE "projectId" = p_project_id
  );
  DELETE FROM "UboqProcurementResourceRequirement" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqCanonicalResourceAccount" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqConsolidationLink" WHERE "consolidationGroupId" IN (
    SELECT id FROM "UboqConsolidationGroup" WHERE "projectId" = p_project_id
  );
  DELETE FROM "UboqConsolidationGroup" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqScheduleActivityLink" WHERE "phaseLineId" IN (
    SELECT id FROM "UboqAwardedPhaseLine" WHERE "projectId" = p_project_id
  );
  DELETE FROM "UboqAgencyEstimateBaseline" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqContractorTargetBudget" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqCashFlowPeriod" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqValidationException" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqAwardedPhaseLine" WHERE "projectId" = p_project_id;
  UPDATE "UboqOperationalSnapshot" SET "supersedesSnapshotId" = NULL WHERE "projectId" = p_project_id;
  DELETE FROM "UboqOperationalSnapshot" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqContractAuthority" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqTaxPricingProfile" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqSourceDocument" WHERE "projectId" = p_project_id;
  DELETE FROM "UboqTemplateDefinition" WHERE "projectId" = p_project_id;
  DELETE FROM "ConsolidatedBOQItem" WHERE "projectId" = p_project_id;
  DELETE FROM "AwardedBOQItem" WHERE "projectId" = p_project_id;
  DELETE FROM "ProjectSchedule" WHERE "projectId" = p_project_id;
  DELETE FROM "ProjectUserAssignment" WHERE "projectId" = p_project_id;
  DELETE FROM "Project" WHERE id = p_project_id;

  PERFORM set_config('app.synthetic_cleanup_authorized', 'off', true);

  RETURN jsonb_build_object(
    'cleanedProjectId', p_project_id,
    'deletedLedgerRows', v_deleted_ledger
  );
END;
$$;
ALTER FUNCTION uboq_execute_verified_synthetic_cleanup(text) OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION uboq_execute_verified_synthetic_cleanup(text) FROM PUBLIC, oserp_compat_app, oserp_legacy_app;
GRANT EXECUTE ON FUNCTION uboq_execute_verified_synthetic_cleanup(text) TO oserp_maint_cleanup_role;

-- 7. Safeguard Trigger 1: ConsolidatedBOQItem Protection (trg_uboq_guard_consolidated_boq)
CREATE OR REPLACE FUNCTION fn_uboq_guard_consolidated_boq()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF COALESCE(OLD."isUboqResourceGoverned", false) = true THEN
      IF NOT (current_user = 'oserp_migrations_owner' AND current_setting('app.synthetic_cleanup_authorized', true) = 'on') THEN
        RAISE EXCEPTION 'UBOQ_PROTECTED_CONSOLIDATED_DELETE: Cannot delete UBOQ-governed ConsolidatedBOQItem %', OLD.id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND COALESCE(OLD."isUboqResourceGoverned", false) = true THEN
    IF current_user = 'oserp_migrations_owner' AND current_setting('app.uboq_snapshot_sync', true) = 'on' THEN
      RETURN NEW;
    END IF;

    IF COALESCE(NEW."isUboqResourceGoverned", false) = false OR NEW.unit IS DISTINCT FROM OLD.unit THEN
      RAISE EXCEPTION 'UBOQ_CONSOLIDATED_IMMUTABLE: Cannot strip UBOQ governance or mutate contract unit on ConsolidatedBOQItem %', OLD.id;
    END IF;

    IF ABS(COALESCE(NEW.quantity, 0) - COALESCE(OLD.quantity, 0)) > 0.0001
       OR ABS(COALESCE(NEW."unitCost", 0) - COALESCE(OLD."unitCost", 0)) > 0.0001 THEN
      RAISE EXCEPTION 'UBOQ_CONSOLIDATED_SNAPSHOT_GUARD: Direct mutation of governed ConsolidatedBOQItem % requires uboq_sync_consolidated_snapshot', OLD.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_uboq_guard_consolidated_boq
BEFORE UPDATE OR DELETE ON "ConsolidatedBOQItem"
FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_consolidated_boq();

-- 8. Safeguard Trigger 2: Shared Line Items Lineage & Resource Unit Guard (I-01 & SNP-V2-01)
CREATE OR REPLACE FUNCTION fn_uboq_guard_shared_line_items()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_gov boolean := false;
  v_cons_proj text;
  v_acct record;
  v_prr record;
  v_po_item record;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."canonicalResourceId" IS NOT NULL THEN
      IF NOT (current_user = 'oserp_migrations_owner' AND current_setting('app.synthetic_cleanup_authorized', true) = 'on') THEN
        RAISE EXCEPTION 'UBOQ_GOVERNED_LINE_DELETE_BLOCKED: Cannot delete resource-governed % row %', TG_TABLE_NAME, OLD.id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  SELECT COALESCE(c."isUboqResourceGoverned", false) OR COALESCE(p."uboqGovernanceEnabled", false), c."projectId"
  INTO v_is_gov, v_cons_proj
  FROM "ConsolidatedBOQItem" c
  JOIN "Project" p ON p.id = c."projectId"
  WHERE c.id = NEW."consolidatedBoqItemId";

  IF NOT COALESCE(v_is_gov, false) AND NEW."canonicalResourceId" IS NULL AND NEW."uboqResourceRequirementId" IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW."canonicalResourceId" IS NULL OR NEW."uboqResourceRequirementId" IS NULL OR NULLIF(TRIM(COALESCE(NEW."resourceUnit", '')), '') IS NULL THEN
    RAISE EXCEPTION 'UBOQ_MISSING_RESOURCE_BINDING: Table % on governed ConsolidatedBOQItem % requires canonicalResourceId, uboqResourceRequirementId, and resourceUnit',
      TG_TABLE_NAME, NEW."consolidatedBoqItemId";
  END IF;

  IF TG_OP = 'UPDATE' AND OLD."canonicalResourceId" IS NOT NULL THEN
    IF NEW."canonicalResourceId" IS DISTINCT FROM OLD."canonicalResourceId"
       OR NEW."uboqResourceRequirementId" IS DISTINCT FROM OLD."uboqResourceRequirementId"
       OR NEW."resourceUnit" IS DISTINCT FROM OLD."resourceUnit" THEN
      RAISE EXCEPTION 'UBOQ_IMMUTABLE_LINEAGE_VIOLATION: Historical PRR/Account/Unit lineage on % row % cannot be overwritten', TG_TABLE_NAME, OLD.id;
    END IF;
  END IF;

  SELECT id, "projectId", "consolidatedBoqItemId", "resourceUomNormalized"
  INTO v_acct
  FROM "UboqCanonicalResourceAccount"
  WHERE id = NEW."canonicalResourceId";

  IF v_acct.id IS NULL THEN
    RAISE EXCEPTION 'UBOQ_INVALID_RESOURCE_ACCOUNT: CanonicalResourceAccount % not found', NEW."canonicalResourceId";
  END IF;

  IF v_acct."projectId" IS DISTINCT FROM v_cons_proj OR v_acct."consolidatedBoqItemId" IS DISTINCT FROM NEW."consolidatedBoqItemId" THEN
    RAISE EXCEPTION 'UBOQ_CROSS_PROJECT_OR_CONSOLIDATED_MISMATCH: Resource account % does not belong to ConsolidatedBOQItem %',
      NEW."canonicalResourceId", NEW."consolidatedBoqItemId";
  END IF;

  IF NEW."resourceUnit" IS DISTINCT FROM v_acct."resourceUomNormalized" THEN
    RAISE EXCEPTION 'UBOQ_RESOURCE_UOM_MISMATCH: Line resourceUnit (%) != CanonicalResourceAccount UOM (%) on %',
      NEW."resourceUnit", v_acct."resourceUomNormalized", TG_TABLE_NAME;
  END IF;

  SELECT id, "canonicalResourceId", status
  INTO v_prr
  FROM "UboqProcurementResourceRequirement"
  WHERE id = NEW."uboqResourceRequirementId";

  IF v_prr.id IS NULL OR v_prr."canonicalResourceId" IS DISTINCT FROM NEW."canonicalResourceId" THEN
    RAISE EXCEPTION 'UBOQ_PRR_ACCOUNT_MISMATCH: PRR % does not belong to CanonicalResourceAccount %',
      NEW."uboqResourceRequirementId", NEW."canonicalResourceId";
  END IF;

  -- Class A origination lines on INSERT require active APPROVED PRR; Class B fulfillment lines permit APPROVED or SUPERSEDED
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME IN ('MaterialRequestItem', 'CanvassItem', 'PurchaseOrderItem') THEN
    IF v_prr.status <> 'APPROVED' THEN
      RAISE EXCEPTION 'UBOQ_INACTIVE_PRR_FOR_NEW_COMMITMENT: % cannot originate against % PRR %',
        TG_TABLE_NAME, v_prr.status, v_prr.id;
    END IF;
  ELSE
    IF v_prr.status NOT IN ('APPROVED', 'SUPERSEDED') THEN
      RAISE EXCEPTION 'UBOQ_UNAPPROVED_PRR_REJECTED: % cannot reference % PRR %',
        TG_TABLE_NAME, v_prr.status, v_prr.id;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'DeliveryItem' THEN
    IF NEW."poItemId" IS NULL THEN
      RAISE EXCEPTION 'UBOQ_DELIVERY_MISSING_PO_ITEM: DeliveryItem on governed resource requires poItemId';
    END IF;
    SELECT id, "canonicalResourceId", "uboqResourceRequirementId", "resourceUnit"
    INTO v_po_item
    FROM "PurchaseOrderItem"
    WHERE id = NEW."poItemId";

    IF v_po_item.id IS NULL
       OR v_po_item."canonicalResourceId" IS DISTINCT FROM NEW."canonicalResourceId"
       OR v_po_item."resourceUnit" IS DISTINCT FROM NEW."resourceUnit" THEN
      RAISE EXCEPTION 'UBOQ_DELIVERY_PO_LINEAGE_MISMATCH: DeliveryItem poItemId % does not match resource lineage', NEW."poItemId";
    END IF;
  END IF;

  -- Note (I-01): IssuanceItem deliberately does NOT require a PurchaseOrder or poItemId so verified opening stock can be issued pre-first-PO!
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_uboq_guard_shared_line_items_mri BEFORE INSERT OR UPDATE OR DELETE ON "MaterialRequestItem" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_shared_line_items();
CREATE TRIGGER trg_uboq_guard_shared_line_items_ci BEFORE INSERT OR UPDATE OR DELETE ON "CanvassItem" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_shared_line_items();
CREATE TRIGGER trg_uboq_guard_shared_line_items_poi BEFORE INSERT OR UPDATE OR DELETE ON "PurchaseOrderItem" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_shared_line_items();
CREATE TRIGGER trg_uboq_guard_shared_line_items_di BEFORE INSERT OR UPDATE OR DELETE ON "DeliveryItem" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_shared_line_items();
CREATE TRIGGER trg_uboq_guard_shared_line_items_ii BEFORE INSERT OR UPDATE OR DELETE ON "IssuanceItem" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_shared_line_items();
CREATE TRIGGER trg_uboq_guard_shared_line_items_ri BEFORE INSERT OR UPDATE OR DELETE ON "ReturnItem" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_shared_line_items();
CREATE TRIGGER trg_uboq_guard_shared_line_items_consi BEFORE INSERT OR UPDATE OR DELETE ON "ConsumptionItem" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_shared_line_items();

-- 9. Safeguard Trigger 3: Parent Header Transitions Require Same-Tx Ledger Proof (RLB-LEG-01 / I-01 / I-02)
CREATE OR REPLACE FUNCTION fn_uboq_guard_parent_headers()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_gov_lines boolean := false;
  v_cur_tx text := pg_current_xact_id()::text;
  v_has_ledger boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF current_user = 'oserp_migrations_owner' AND current_setting('app.synthetic_cleanup_authorized', true) = 'on' THEN
      RETURN OLD;
    END IF;
    IF TG_TABLE_NAME = 'MaterialRequest' THEN
      SELECT EXISTS(SELECT 1 FROM "MaterialRequestItem" WHERE "mrId" = OLD.id AND "canonicalResourceId" IS NOT NULL) INTO v_has_gov_lines;
    ELSIF TG_TABLE_NAME = 'PurchaseOrder' THEN
      SELECT EXISTS(SELECT 1 FROM "PurchaseOrderItem" WHERE "poId" = OLD.id AND "canonicalResourceId" IS NOT NULL) INTO v_has_gov_lines;
    ELSIF TG_TABLE_NAME = 'Delivery' THEN
      SELECT EXISTS(SELECT 1 FROM "DeliveryItem" WHERE "deliveryId" = OLD.id AND "canonicalResourceId" IS NOT NULL) INTO v_has_gov_lines;
    ELSIF TG_TABLE_NAME = 'MaterialIssuance' THEN
      SELECT EXISTS(SELECT 1 FROM "IssuanceItem" WHERE "issuanceId" = OLD.id AND "canonicalResourceId" IS NOT NULL) INTO v_has_gov_lines;
    ELSIF TG_TABLE_NAME = 'MaterialReturn' THEN
      SELECT EXISTS(SELECT 1 FROM "ReturnItem" WHERE "returnId" = OLD.id AND "canonicalResourceId" IS NOT NULL) INTO v_has_gov_lines;
    END IF;
    IF v_has_gov_lines THEN
      RAISE EXCEPTION 'UBOQ_HEADER_DELETE_BLOCKED: Cannot delete resource-governed % header %', TG_TABLE_NAME, OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE checks
  IF TG_TABLE_NAME = 'MaterialRequest' THEN
    SELECT EXISTS(SELECT 1 FROM "MaterialRequestItem" WHERE "mrId" = NEW.id AND "canonicalResourceId" IS NOT NULL) INTO v_has_gov_lines;
    IF v_has_gov_lines AND NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'APPROVED' THEN
        SELECT EXISTS(
          SELECT 1 FROM "UboqResourceLedgerEntry"
          WHERE "sourceHeaderId" = NEW.id AND "txId" = v_cur_tx AND "eventType" = 'MRF_RESERVE'
        ) INTO v_has_ledger;
        IF NOT v_has_ledger THEN
          RAISE EXCEPTION 'UBOQ_UNMEDIATED_HEADER_MUTATION: MaterialRequest % approval requires same-tx MRF_RESERVE ledger entry', NEW.id;
        END IF;
      ELSIF OLD.status = 'APPROVED' AND NEW.status IN ('CANCELLED', 'REJECTED', 'VOID') THEN
        SELECT EXISTS(
          SELECT 1 FROM "UboqResourceLedgerEntry"
          WHERE "sourceHeaderId" = NEW.id AND "txId" = v_cur_tx AND "eventType" = 'MRF_RELEASE'
        ) INTO v_has_ledger;
        IF NOT v_has_ledger THEN
          RAISE EXCEPTION 'UBOQ_UNMEDIATED_HEADER_MUTATION: MaterialRequest % cancellation requires same-tx MRF_RELEASE ledger entry', NEW.id;
        END IF;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'PurchaseOrder' THEN
    SELECT EXISTS(SELECT 1 FROM "PurchaseOrderItem" WHERE "poId" = NEW.id AND "canonicalResourceId" IS NOT NULL) INTO v_has_gov_lines;
    IF v_has_gov_lines THEN
      -- Preserve historic approval proof permanently across COMPLETED transitions (I-02)
      IF OLD."approvedAt" IS NOT NULL AND NEW."approvedAt" IS DISTINCT FROM OLD."approvedAt" THEN
        RAISE EXCEPTION 'UBOQ_PO_HISTORIC_APPROVAL_IMMUTABLE: Cannot erase or overwrite approvedAt on governed PO %', NEW.id;
      END IF;
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NEW.status = 'APPROVED' AND OLD.status NOT IN ('APPROVED', 'ISSUED', 'PARTIAL_DELIVERY', 'COMPLETED') THEN
          IF NEW."approvedAt" IS NULL THEN
            NEW."approvedAt" := NOW();
          END IF;
          SELECT EXISTS(
            SELECT 1 FROM "UboqResourceLedgerEntry"
            WHERE "sourceHeaderId" = NEW.id AND "txId" = v_cur_tx AND "eventType" IN ('PO_COMMIT_TRANSFER', 'PO_DIRECT_COMMIT')
          ) INTO v_has_ledger;
          IF NOT v_has_ledger THEN
            RAISE EXCEPTION 'UBOQ_UNMEDIATED_HEADER_MUTATION: PurchaseOrder % approval requires same-tx PO_COMMIT ledger entry', NEW.id;
          END IF;
        ELSIF NEW.status IN ('CANCELLED', 'CLOSED_SHORT', 'VOID') AND OLD.status IN ('APPROVED', 'ISSUED', 'PARTIAL_DELIVERY') THEN
          SELECT EXISTS(
            SELECT 1 FROM "UboqResourceLedgerEntry"
            WHERE "sourceHeaderId" = NEW.id AND "txId" = v_cur_tx AND "eventType" = 'PO_CLOSE_SHORT'
          ) INTO v_has_ledger;
          IF NOT v_has_ledger THEN
            RAISE EXCEPTION 'UBOQ_UNMEDIATED_HEADER_MUTATION: PurchaseOrder % close/cancel requires same-tx PO_CLOSE_SHORT ledger entry', NEW.id;
          END IF;
        ELSIF NEW.status IN ('ISSUED', 'PARTIAL_DELIVERY', 'COMPLETED') THEN
          IF OLD."approvedAt" IS NULL AND OLD.status NOT IN ('APPROVED', 'ISSUED', 'PARTIAL_DELIVERY', 'COMPLETED') THEN
            RAISE EXCEPTION 'UBOQ_UNAPPROVED_PO_PROGRESSION: PurchaseOrder % cannot transition to % without prior approval', NEW.id, NEW.status;
          END IF;
        END IF;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'Delivery' THEN
    SELECT EXISTS(SELECT 1 FROM "DeliveryItem" WHERE "deliveryId" = NEW.id AND "canonicalResourceId" IS NOT NULL) INTO v_has_gov_lines;
    IF v_has_gov_lines AND NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'APPROVED' THEN
        SELECT EXISTS(
          SELECT 1 FROM "UboqResourceLedgerEntry"
          WHERE "sourceHeaderId" = NEW.id AND "txId" = v_cur_tx AND "eventType" = 'DELIVERY_RECEIVE'
        ) INTO v_has_ledger;
        IF NOT v_has_ledger THEN
          RAISE EXCEPTION 'UBOQ_UNMEDIATED_HEADER_MUTATION: Delivery % approval requires same-tx DELIVERY_RECEIVE ledger entry', NEW.id;
        END IF;
      ELSIF OLD.status = 'APPROVED' AND NEW.status IN ('REVERSED', 'CANCELLED', 'VOID') THEN
        SELECT EXISTS(
          SELECT 1 FROM "UboqResourceLedgerEntry"
          WHERE "sourceHeaderId" = NEW.id AND "txId" = v_cur_tx AND "eventType" = 'DELIVERY_REVERSAL'
        ) INTO v_has_ledger;
        IF NOT v_has_ledger THEN
          RAISE EXCEPTION 'UBOQ_UNMEDIATED_HEADER_MUTATION: Delivery % reversal requires same-tx DELIVERY_REVERSAL ledger entry', NEW.id;
        END IF;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'MaterialIssuance' THEN
    SELECT EXISTS(SELECT 1 FROM "IssuanceItem" WHERE "issuanceId" = NEW.id AND "canonicalResourceId" IS NOT NULL) INTO v_has_gov_lines;
    IF v_has_gov_lines AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'RELEASED' THEN
      -- Validates warehouse stock issuance via ledger (supports pre-first-PO opening stock issuance per I-01!)
      SELECT EXISTS(
        SELECT 1 FROM "UboqResourceLedgerEntry"
        WHERE "sourceHeaderId" = NEW.id AND "txId" = v_cur_tx AND "eventType" = 'ISSUANCE_CONSUME'
      ) INTO v_has_ledger;
      IF NOT v_has_ledger THEN
        RAISE EXCEPTION 'UBOQ_UNMEDIATED_HEADER_MUTATION: MaterialIssuance % release requires same-tx ISSUANCE_CONSUME ledger entry', NEW.id;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'MaterialReturn' THEN
    SELECT EXISTS(SELECT 1 FROM "ReturnItem" WHERE "returnId" = NEW.id AND "canonicalResourceId" IS NOT NULL) INTO v_has_gov_lines;
    IF v_has_gov_lines AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'COMPLETED' THEN
      SELECT EXISTS(
        SELECT 1 FROM "UboqResourceLedgerEntry"
        WHERE "sourceHeaderId" = NEW.id AND "txId" = v_cur_tx AND "eventType" IN ('RETURN_GOOD_RESTORE', 'RETURN_DAMAGED_QUARANTINE')
      ) INTO v_has_ledger;
      IF NOT v_has_ledger THEN
        RAISE EXCEPTION 'UBOQ_UNMEDIATED_HEADER_MUTATION: MaterialReturn % completion requires same-tx RETURN ledger entry', NEW.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_uboq_guard_parent_mr BEFORE UPDATE OR DELETE ON "MaterialRequest" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_parent_headers();
CREATE TRIGGER trg_uboq_guard_parent_po BEFORE UPDATE OR DELETE ON "PurchaseOrder" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_parent_headers();
CREATE TRIGGER trg_uboq_guard_parent_deliv BEFORE UPDATE OR DELETE ON "Delivery" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_parent_headers();
CREATE TRIGGER trg_uboq_guard_parent_iss BEFORE UPDATE OR DELETE ON "MaterialIssuance" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_parent_headers();
CREATE TRIGGER trg_uboq_guard_parent_ret BEFORE UPDATE OR DELETE ON "MaterialReturn" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_parent_headers();

-- 10. Safeguard Trigger 4: AP, Cost Ledger & ExpenseBreakdownItem Price/Unit Parity + COMPLETED Historic PO Support (RLB-LEG-02 / I-02)
CREATE OR REPLACE FUNCTION fn_uboq_guard_ap_and_expenses()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_po record;
  v_expected_amt numeric(18, 4);
  v_po_item record;
  v_exp record;
  v_ref_po_gov boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF current_user = 'oserp_migrations_owner' AND current_setting('app.synthetic_cleanup_authorized', true) = 'on' THEN
      RETURN OLD;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_TABLE_NAME = 'AccountsPayable' THEN
    SELECT po.id, po.status, po."approvedAt",
           EXISTS(SELECT 1 FROM "PurchaseOrderItem" poi WHERE poi."poId" = po.id AND poi."canonicalResourceId" IS NOT NULL) AS is_gov
    INTO v_po
    FROM "PurchaseOrder" po
    WHERE po.id = NEW."poId";

    IF COALESCE(v_po.is_gov, false) THEN
      -- I-02: Accept historic approved PO even when current status is COMPLETED!
      IF v_po."approvedAt" IS NULL AND v_po.status NOT IN ('APPROVED', 'ISSUED', 'PARTIAL_DELIVERY', 'COMPLETED') THEN
        RAISE EXCEPTION 'UBOQ_AP_UNAPPROVED_PO: AccountsPayable cannot settle unapproved governed PO % (status=%)', NEW."poId", v_po.status;
      END IF;

      SELECT COALESCE(SUM(di.quantity::numeric * poi."unitCost"::numeric), 0)
      INTO v_expected_amt
      FROM "DeliveryItem" di
      JOIN "PurchaseOrderItem" poi ON poi.id = di."poItemId"
      WHERE di."deliveryId" = NEW."deliveryId";

      IF v_expected_amt > 0 AND ABS(NEW.amount::numeric - v_expected_amt) > 0.05 THEN
        RAISE EXCEPTION 'UBOQ_AP_AMOUNT_PARITY_VIOLATION: AccountsPayable amount (%) != approved PO line delivery value (%)',
          NEW.amount, v_expected_amt;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'ProjectCostLedger' THEN
    IF NEW."consolidatedBoqItemId" IS NOT NULL AND NEW."referenceDocumentType" = 'DELIVERY_RECEIPT' THEN
      IF EXISTS(SELECT 1 FROM "ConsolidatedBOQItem" WHERE id = NEW."consolidatedBoqItemId" AND COALESCE("isUboqResourceGoverned", false) = true) THEN
        IF NEW."poItemId" IS NULL OR NEW."canonicalResourceId" IS NULL THEN
          RAISE EXCEPTION 'UBOQ_COST_LEDGER_MISSING_PO_LINEAGE: Governed DELIVERY_RECEIPT cost ledger requires poItemId and canonicalResourceId';
        END IF;
        SELECT poi.id, poi."unitCost", poi."resourceUnit", po."approvedAt", po.status
        INTO v_po_item
        FROM "PurchaseOrderItem" poi
        JOIN "PurchaseOrder" po ON po.id = poi."poId"
        WHERE poi.id = NEW."poItemId";

        IF v_po_item.id IS NULL OR (v_po_item."approvedAt" IS NULL AND v_po_item.status NOT IN ('APPROVED', 'ISSUED', 'PARTIAL_DELIVERY', 'COMPLETED')) THEN
          RAISE EXCEPTION 'UBOQ_COST_LEDGER_UNAPPROVED_PO: poItemId % lacks historic PO approval', NEW."poItemId";
        END IF;
        IF NEW."resourceUnit" IS DISTINCT FROM v_po_item."resourceUnit" OR ABS(NEW."unitCost" - v_po_item."unitCost") > 0.0001 THEN
          RAISE EXCEPTION 'UBOQ_COST_LEDGER_RATE_UNIT_MISMATCH: Cost ledger unit/rate (%, %) != PO item (%, %)',
            NEW."resourceUnit", NEW."unitCost", v_po_item."resourceUnit", v_po_item."unitCost";
        END IF;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'ExpenseBreakdownItem' THEN
    SELECT e.id, e."projectId", e.category
    INTO v_exp
    FROM "Expense" e
    WHERE e.id = NEW."expenseId";

    IF NEW."purchaseReferenceNo" IS NOT NULL THEN
      SELECT EXISTS(
        SELECT 1 FROM "PurchaseOrder" po
        JOIN "PurchaseOrderItem" poi ON poi."poId" = po.id
        WHERE po."poNumber" = NEW."purchaseReferenceNo" AND poi."canonicalResourceId" IS NOT NULL
      ) INTO v_ref_po_gov;
    END IF;

    IF COALESCE(v_ref_po_gov, false) OR NEW."poItemId" IS NOT NULL OR NEW."canonicalResourceId" IS NOT NULL THEN
      IF NEW."poItemId" IS NULL OR NEW."canonicalResourceId" IS NULL THEN
        RAISE EXCEPTION 'UBOQ_EXPENSE_BREAKDOWN_MISSING_PO_ITEM: Governed PO payment breakdown requires poItemId and canonicalResourceId (RLB-LEG-02)';
      END IF;

      SELECT poi.id, poi."canonicalResourceId", poi."resourceUnit", poi."unitCost", po."approvedAt", po.status
      INTO v_po_item
      FROM "PurchaseOrderItem" poi
      JOIN "PurchaseOrder" po ON po.id = poi."poId"
      WHERE poi.id = NEW."poItemId";

      -- I-02: Historic approved PO remains valid for payment settlement even when po.status = 'COMPLETED'
      IF v_po_item.id IS NULL OR (v_po_item."approvedAt" IS NULL AND v_po_item.status NOT IN ('APPROVED', 'ISSUED', 'PARTIAL_DELIVERY', 'COMPLETED')) THEN
        RAISE EXCEPTION 'UBOQ_EXPENSE_UNAPPROVED_PO_ITEM: poItemId % lacks historic PO approval proof', NEW."poItemId";
      END IF;

      IF NEW.unit IS DISTINCT FROM v_po_item."resourceUnit" OR ABS(NEW."unitCost" - v_po_item."unitCost") > 0.0001 THEN
        RAISE EXCEPTION 'UBOQ_EXPENSE_RATE_UNIT_CORRUPTION_BLOCKED: Breakdown (unit=%, rate=%) != PO item (unit=%, rate=%)',
          NEW.unit, NEW."unitCost", v_po_item."resourceUnit", v_po_item."unitCost";
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_uboq_guard_ap BEFORE INSERT OR UPDATE OR DELETE ON "AccountsPayable" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_ap_and_expenses();
CREATE TRIGGER trg_uboq_guard_pcl BEFORE INSERT OR UPDATE OR DELETE ON "ProjectCostLedger" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_ap_and_expenses();
CREATE TRIGGER trg_uboq_guard_ebi BEFORE INSERT OR UPDATE OR DELETE ON "ExpenseBreakdownItem" FOR EACH ROW EXECUTE FUNCTION fn_uboq_guard_ap_and_expenses();

-- 11. Safeguard Trigger 5: Immutability & Cascade-Delete Blocker (trg_block_protected_uboq_cascade_delete)
CREATE OR REPLACE FUNCTION fn_block_protected_uboq_cascade_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user = 'oserp_migrations_owner' AND current_setting('app.synthetic_cleanup_authorized', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'UboqResourceLedgerEntry' THEN
    RAISE EXCEPTION 'UBOQ_LEDGER_IMMUTABLE: UboqResourceLedgerEntry is append-only; % is prohibited', TG_OP;
  END IF;

  IF TG_TABLE_NAME = 'UboqOperationalSnapshot' THEN
    IF TG_OP = 'DELETE' AND OLD.status IN ('APPROVED', 'SUPERSEDED') THEN
      RAISE EXCEPTION 'UBOQ_SNAPSHOT_IMMUTABLE: Cannot delete % snapshot %', OLD.status, OLD.id;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.status IN ('APPROVED', 'SUPERSEDED') THEN
      IF NOT (OLD.status = 'APPROVED' AND NEW.status = 'SUPERSEDED' AND NEW."canonicalHash" = OLD."canonicalHash") THEN
        RAISE EXCEPTION 'UBOQ_SNAPSHOT_IMMUTABLE: Approved snapshot % can only transition APPROVED -> SUPERSEDED without altering hash', OLD.id;
      END IF;
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_TABLE_NAME = 'UboqProcurementResourceRequirement' THEN
    IF TG_OP = 'DELETE' AND OLD.status IN ('APPROVED', 'SUPERSEDED') THEN
      RAISE EXCEPTION 'UBOQ_PRR_IMMUTABLE: Cannot delete % PRR %', OLD.status, OLD.id;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.status IN ('APPROVED', 'SUPERSEDED') THEN
      IF NOT (
        OLD.status = 'APPROVED' AND NEW.status = 'SUPERSEDED' AND
        NEW."requiredQty" = OLD."requiredQty" AND
        NEW."canonicalResourceId" = OLD."canonicalResourceId" AND
        NEW."versionNumber" = OLD."versionNumber"
      ) THEN
        RAISE EXCEPTION 'UBOQ_PRR_IMMUTABLE: Approved PRR % is immutable except status -> SUPERSEDED', OLD.id;
      END IF;
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_TABLE_NAME = 'UboqCanonicalResourceAccount' AND TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'UBOQ_ACCOUNT_DELETE_BLOCKED: Cannot delete UboqCanonicalResourceAccount %', OLD.id;
  END IF;

  IF TG_TABLE_NAME = 'Project' AND TG_OP = 'DELETE' THEN
    IF COALESCE(OLD."uboqGovernanceEnabled", false) = true
       OR EXISTS(SELECT 1 FROM "UboqResourceLedgerEntry" WHERE "projectId" = OLD.id)
       OR EXISTS(SELECT 1 FROM "UboqOperationalSnapshot" WHERE "projectId" = OLD.id) THEN
      RAISE EXCEPTION 'UBOQ_PROJECT_DELETE_BLOCKED: Cannot delete UBOQ-governed project % outside verified synthetic cleanup', OLD.id;
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER trg_block_uboq_ledger_mut BEFORE UPDATE OR DELETE ON "UboqResourceLedgerEntry" FOR EACH ROW EXECUTE FUNCTION fn_block_protected_uboq_cascade_delete();
CREATE TRIGGER trg_block_uboq_snapshot_mut BEFORE UPDATE OR DELETE ON "UboqOperationalSnapshot" FOR EACH ROW EXECUTE FUNCTION fn_block_protected_uboq_cascade_delete();
CREATE TRIGGER trg_block_uboq_prr_mut BEFORE UPDATE OR DELETE ON "UboqProcurementResourceRequirement" FOR EACH ROW EXECUTE FUNCTION fn_block_protected_uboq_cascade_delete();
CREATE TRIGGER trg_block_uboq_acct_del BEFORE DELETE ON "UboqCanonicalResourceAccount" FOR EACH ROW EXECUTE FUNCTION fn_block_protected_uboq_cascade_delete();
CREATE TRIGGER trg_block_uboq_proj_del BEFORE DELETE ON "Project" FOR EACH ROW EXECUTE FUNCTION fn_block_protected_uboq_cascade_delete();


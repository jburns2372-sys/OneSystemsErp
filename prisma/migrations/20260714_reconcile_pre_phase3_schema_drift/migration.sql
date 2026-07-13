-- AlterTable
ALTER TABLE "public"."BOQMapping" ADD COLUMN     "procurementBenchmarkItemId" TEXT,
ALTER COLUMN "awardedBoqItemId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."CountermeasureLog" ADD COLUMN     "actualResult" TEXT,
ADD COLUMN     "expectedResult" TEXT,
ADD COLUMN     "passed" BOOLEAN,
ADD COLUMN     "responseTimeMs" INTEGER;

-- AlterTable
ALTER TABLE "public"."SecurityEvent" ADD COLUMN     "actualResponse" TEXT,
ADD COLUMN     "expectedResponse" TEXT,
ADD COLUMN     "simulationPassed" BOOLEAN,
ADD COLUMN     "simulationRunId" TEXT;

-- AlterTable
ALTER TABLE "public"."SecurityIncident" ADD COLUMN     "evidenceJson" TEXT,
ADD COLUMN     "linkedSimulationRunId" TEXT,
ADD COLUMN     "timelineJson" TEXT;

-- CreateTable
CREATE TABLE "public"."BOQExtractedItem" (
    "id" TEXT NOT NULL,
    "uploadedWorkbookFileId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sectionId" TEXT,
    "sheetName" TEXT,
    "sourceRowNumber" INTEGER,
    "itemNumber" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "quantity" DOUBLE PRECISION,
    "materialUnitCost" DOUBLE PRECISION,
    "laborUnitCost" DOUBLE PRECISION,
    "equipmentUnitCost" DOUBLE PRECISION,
    "totalDirectCost" DOUBLE PRECISION,
    "ocm" DOUBLE PRECISION,
    "cp" DOUBLE PRECISION,
    "vat" DOUBLE PRECISION,
    "totalIndirectCost" DOUBLE PRECISION,
    "unitCost" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "formulaMapJson" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "validationErrorsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BOQExtractedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BOQExtractedSection" (
    "id" TEXT NOT NULL,
    "uploadedWorkbookFileId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sheetName" TEXT,
    "sourceRowNumber" INTEGER,
    "sectionCode" TEXT,
    "sectionName" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BOQExtractedSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnlyOfficeSession" (
    "id" TEXT NOT NULL,
    "uploadedWorkbookFileId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workbookVersionId" TEXT,
    "documentKey" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'view',
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "permissionsJson" TEXT,
    "configJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastCallbackAt" TIMESTAMP(3),

    CONSTRAINT "OnlyOfficeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectBOQVersion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceUploadedWorkbookFileId" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "versionLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "committedBy" TEXT,
    "committedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "totalDirectCost" DOUBLE PRECISION,
    "totalIndirectCost" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectBOQVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecuritySimulationArchive" (
    "id" TEXT NOT NULL,
    "archiveNumber" TEXT NOT NULL,
    "simulationRunId" TEXT,
    "campaignId" TEXT,
    "scenarioName" TEXT,
    "runMode" TEXT,
    "environment" TEXT,
    "initiatedBy" TEXT,
    "clearedBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEventsArchived" INTEGER,
    "totalIncidentsArchived" INTEGER,
    "totalCountermeasuresArchived" INTEGER,
    "detectionScore" DOUBLE PRECISION,
    "responseScore" DOUBLE PRECISION,
    "evidenceScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "overallResult" TEXT,
    "archiveJson" TEXT,
    "exportedPdfUrl" TEXT,
    "exportedExcelUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecuritySimulationArchive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecuritySimulationCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL,
    "scenarioSequenceJson" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecuritySimulationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecuritySimulationRun" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT,
    "campaignId" TEXT,
    "runMode" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "initiatedBy" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "detectionScore" DOUBLE PRECISION,
    "responseScore" DOUBLE PRECISION,
    "evidenceScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "overallResult" TEXT,
    "notes" TEXT,

    CONSTRAINT "SecuritySimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecuritySimulationScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "targetModule" TEXT NOT NULL,
    "targetRoute" TEXT,
    "simulatedRole" TEXT,
    "simulatedSourceIp" TEXT,
    "simulatedCountry" TEXT,
    "simulatedCity" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "mitreTechnique" TEXT,
    "owaspCategory" TEXT,
    "expectedDetection" TEXT,
    "expectedCountermeasure" TEXT,
    "passFailCriteria" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecuritySimulationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UploadedWorkbookFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "preservedOriginalUrl" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recognizedTemplate" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commitStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "documentType" TEXT,
    "extractionStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "fileSize" INTEGER NOT NULL,
    "latestPreservedVersionId" TEXT,
    "metadataJson" TEXT,
    "mimeType" TEXT NOT NULL,
    "onlyOfficeDocumentKey" TEXT,
    "templateCode" TEXT,
    "templateName" TEXT,
    "templateVersion" TEXT,

    CONSTRAINT "UploadedWorkbookFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkbookExtractionAudit" (
    "id" TEXT NOT NULL,
    "uploadedWorkbookFileId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "message" TEXT,
    "detailsJson" TEXT,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "performedByRole" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "WorkbookExtractionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkbookFormulaValidation" (
    "id" TEXT NOT NULL,
    "uploadedWorkbookFileId" TEXT NOT NULL,
    "sheetName" TEXT,
    "cellAddress" TEXT NOT NULL,
    "sourceRowNumber" INTEGER,
    "expectedFormula" TEXT,
    "actualFormula" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "actualValue" DOUBLE PRECISION,
    "expectedValue" DOUBLE PRECISION,

    CONSTRAINT "WorkbookFormulaValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkbookTemplateValidation" (
    "id" TEXT NOT NULL,
    "uploadedWorkbookFileId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "validationType" TEXT NOT NULL,
    "validationKey" TEXT NOT NULL,
    "expectedValue" TEXT,
    "actualValue" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkbookTemplateValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkbookVersion" (
    "id" TEXT NOT NULL,
    "uploadedWorkbookFileId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "versionLabel" TEXT,
    "sourceType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "WorkbookVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnlyOfficeSession_documentKey_key" ON "public"."OnlyOfficeSession"("documentKey" ASC);

-- AddForeignKey
ALTER TABLE "public"."BOQExtractedItem" ADD CONSTRAINT "BOQExtractedItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BOQExtractedItem" ADD CONSTRAINT "BOQExtractedItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."BOQExtractedSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BOQExtractedItem" ADD CONSTRAINT "BOQExtractedItem_uploadedWorkbookFileId_fkey" FOREIGN KEY ("uploadedWorkbookFileId") REFERENCES "public"."UploadedWorkbookFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BOQExtractedSection" ADD CONSTRAINT "BOQExtractedSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BOQExtractedSection" ADD CONSTRAINT "BOQExtractedSection_uploadedWorkbookFileId_fkey" FOREIGN KEY ("uploadedWorkbookFileId") REFERENCES "public"."UploadedWorkbookFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BOQMapping" ADD CONSTRAINT "BOQMapping_procurementBenchmarkItemId_fkey" FOREIGN KEY ("procurementBenchmarkItemId") REFERENCES "public"."ProcurementBenchmarkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnlyOfficeSession" ADD CONSTRAINT "OnlyOfficeSession_uploadedWorkbookFileId_fkey" FOREIGN KEY ("uploadedWorkbookFileId") REFERENCES "public"."UploadedWorkbookFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnlyOfficeSession" ADD CONSTRAINT "OnlyOfficeSession_workbookVersionId_fkey" FOREIGN KEY ("workbookVersionId") REFERENCES "public"."WorkbookVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityEvent" ADD CONSTRAINT "SecurityEvent_simulationRunId_fkey" FOREIGN KEY ("simulationRunId") REFERENCES "public"."SecuritySimulationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityIncident" ADD CONSTRAINT "SecurityIncident_linkedSimulationRunId_fkey" FOREIGN KEY ("linkedSimulationRunId") REFERENCES "public"."SecuritySimulationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecuritySimulationRun" ADD CONSTRAINT "SecuritySimulationRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."SecuritySimulationCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecuritySimulationRun" ADD CONSTRAINT "SecuritySimulationRun_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "public"."SecuritySimulationScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UploadedWorkbookFile" ADD CONSTRAINT "UploadedWorkbookFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkbookExtractionAudit" ADD CONSTRAINT "WorkbookExtractionAudit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkbookExtractionAudit" ADD CONSTRAINT "WorkbookExtractionAudit_uploadedWorkbookFileId_fkey" FOREIGN KEY ("uploadedWorkbookFileId") REFERENCES "public"."UploadedWorkbookFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkbookFormulaValidation" ADD CONSTRAINT "WorkbookFormulaValidation_uploadedWorkbookFileId_fkey" FOREIGN KEY ("uploadedWorkbookFileId") REFERENCES "public"."UploadedWorkbookFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkbookTemplateValidation" ADD CONSTRAINT "WorkbookTemplateValidation_uploadedWorkbookFileId_fkey" FOREIGN KEY ("uploadedWorkbookFileId") REFERENCES "public"."UploadedWorkbookFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkbookVersion" ADD CONSTRAINT "WorkbookVersion_uploadedWorkbookFileId_fkey" FOREIGN KEY ("uploadedWorkbookFileId") REFERENCES "public"."UploadedWorkbookFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

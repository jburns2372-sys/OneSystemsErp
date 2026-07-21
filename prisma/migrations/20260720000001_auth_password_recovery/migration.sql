-- Migration 1
-- CreateEnum
CREATE TYPE "ProjectScheduleWorkflowStatus" AS ENUM ('AI_GENERATED_DRAFT', 'INVALID_GENERATED_DRAFT', 'READY_FOR_REVIEW', 'UNDER_TECHNICAL_REVIEW', 'TECHNICAL_REVISIONS_REQUIRED', 'TECHNICALLY_APPROVED', 'UNDER_CONTRACT_REVIEW', 'CONTRACT_REVISIONS_REQUIRED', 'CONTRACT_APPROVED', 'UNDER_FINANCE_REVIEW', 'FINANCE_REVISIONS_REQUIRED', 'FINANCE_APPROVED', 'PENDING_BASELINE_APPROVAL', 'ACTIVE_BASELINE', 'SUPERSEDED_BASELINE', 'ARCHIVED_BASELINE', 'REJECTED');

-- CreateEnum
CREATE TYPE "ScheduleApprovalStage" AS ENUM ('TECHNICAL', 'CONTRACT', 'FINANCE', 'FINAL_ACTIVATION');

-- CreateEnum
CREATE TYPE "ScheduleApprovalDecision" AS ENUM ('APPROVE', 'RETURN_FOR_REVISION', 'REJECT', 'REQUEST_CLARIFICATION');

-- CreateEnum
CREATE TYPE "ScheduleCommentType" AS ENUM ('TECHNICAL', 'FINANCIAL', 'BOQ_ALLOCATION', 'SEQUENCE', 'DURATION', 'PRODUCTIVITY', 'CREW', 'WORK_FRONT', 'CPM', 'CONTRACT_DATE', 'COMMISSIONING', 'CLOSEOUT');

-- CreateEnum
CREATE TYPE "ScheduleCommentStatus" AS ENUM ('OPEN', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinancialWaiverStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ScheduleRevisionType" AS ENUM ('AI_REGENERATION', 'TECHNICAL_CORRECTION', 'CONTRACT_CORRECTION', 'FINANCIAL_CORRECTION', 'RECOVERY', 'VARIATION_ORDER', 'TIME_EXTENSION', 'SUSPENSION_RESUMPTION', 'METHODOLOGY_CHANGE', 'RESOURCE_CHANGE', 'CLIENT_INSTRUCTION');

-- CreateEnum
CREATE TYPE "ScheduleWorkflowAction" AS ENUM ('SUBMIT_DRAFT_FOR_REVIEW', 'START_TECHNICAL_REVIEW');

-- DropForeignKey
ALTER TABLE "ScheduleBOQMapping" DROP CONSTRAINT "ScheduleBOQMapping_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleBOQMapping" DROP CONSTRAINT "ScheduleBOQMapping_awardedBoqItemId_fkey";

-- DropIndex
DROP INDEX "ProjectSchedule_projectId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "BOQMapping" ADD COLUMN     "procurementBenchmarkItemId" TEXT,
ALTER COLUMN "awardedBoqItemId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProjectSchedule" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "activatedById" TEXT,
ADD COLUMN     "activationSnapshotHash" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "awardedContractAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "baselineCode" TEXT,
ADD COLUMN     "baselineRevision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "differenceAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "feasibilityFlags" TEXT,
ADD COLUMN     "generatedAt" TIMESTAMP(3),
ADD COLUMN     "generatedBy" TEXT,
ADD COLUMN     "generatedById" TEXT,
ADD COLUMN     "generationRulesVersion" TEXT,
ADD COLUMN     "lockedBOQChecksum" TEXT,
ADD COLUMN     "lockedBOQVersionId" TEXT,
ADD COLUMN     "openAiModelIdentifier" TEXT,
ADD COLUMN     "parentScheduleId" TEXT,
ADD COLUMN     "previousBaselineId" TEXT,
ADD COLUMN     "projectCompletionDate" TIMESTAMP(3),
ADD COLUMN     "projectStartDate" TIMESTAMP(3),
ADD COLUMN     "promptVersion" TEXT,
ADD COLUMN     "reviewRound" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "revisionCode" TEXT,
ADD COLUMN     "revisionNumber" INTEGER,
ADD COLUMN     "rowVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "scheduledAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "schedulingEngineVersion" TEXT,
ADD COLUMN     "validationMetrics" TEXT,
ADD COLUMN     "validationRulesVersion" TEXT,
ADD COLUMN     "workflowStatus" "ProjectScheduleWorkflowStatus" NOT NULL DEFAULT 'AI_GENERATED_DRAFT';

-- AlterTable
ALTER TABLE "ScheduleActivity" ADD COLUMN     "activityType" TEXT,
ADD COLUMN     "aiRationale" TEXT,
ADD COLUMN     "allocatedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "classificationConfidence" DOUBLE PRECISION,
ADD COLUMN     "crewCountAssumption" INTEGER,
ADD COLUMN     "durationMethod" TEXT,
ADD COLUMN     "predecessorData" TEXT,
ADD COLUMN     "productivityAssumption" DOUBLE PRECISION,
ADD COLUMN     "systemOrArea" TEXT,
ADD COLUMN     "workFrontAssumption" INTEGER;

-- AlterTable
ALTER TABLE "ProjectBOQVersion" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "checksumAlgorithm" TEXT,
ADD COLUMN     "checksumVersion" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedById" TEXT,
ADD COLUMN     "sourceProvenance" TEXT;

-- DropTable
DROP TABLE "ScheduleBOQMapping";

-- CreateTable
CREATE TABLE "ScheduleBOQAllocation" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "awardedBoqItemId" TEXT NOT NULL,
    "mappedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mappedWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scheduleId" TEXT,
    "projectId" TEXT,
    "phaseId" TEXT,
    "boqLineId" TEXT,
    "allocationMode" TEXT,
    "awardedQuantity" DECIMAL(65,30),
    "allocatedQuantity" DECIMAL(65,30),
    "allocatedPercentage" DECIMAL(65,30),
    "awardedAmount" DECIMAL(65,30),
    "allocatedAmount" DECIMAL(65,30),
    "allocationReason" TEXT,

    CONSTRAINT "ScheduleBOQAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleGenerationAudit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "previousScheduleId" TEXT,
    "newScheduleId" TEXT,
    "lockedBOQVersionId" TEXT,
    "lockedBOQChecksum" TEXT,
    "generationRequestId" TEXT,
    "modelIdentifier" TEXT,
    "promptVersion" TEXT,
    "schemaVersion" TEXT,
    "schedulingRulesVersion" TEXT,
    "reasoningSetting" TEXT,
    "requestTimestamp" TIMESTAMP(3),
    "responseTimestamp" TIMESTAMP(3),
    "tokenUsage" TEXT,
    "resultStatus" TEXT,
    "validationResults" TEXT,
    "correctionAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleGenerationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConfiguration" (
    "id" TEXT NOT NULL,
    "primaryPlanningModel" TEXT NOT NULL DEFAULT 'gpt-4o',
    "secondaryClassificationModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "fallbackModel" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "reasoningEffort" TEXT NOT NULL DEFAULT 'high',
    "maxOutputTokens" INTEGER NOT NULL DEFAULT 4096,
    "timeoutMs" INTEGER NOT NULL DEFAULT 60000,
    "retryLimit" INTEGER NOT NULL DEFAULT 2,
    "promptVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "jsonSchemaVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "schedulingRulesVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleApproval" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "reviewRound" INTEGER NOT NULL,
    "revisionCode" TEXT,
    "approvalStage" "ScheduleApprovalStage" NOT NULL,
    "decision" "ScheduleApprovalDecision" NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerNameSnapshot" TEXT NOT NULL,
    "reviewerRoleSnapshot" TEXT NOT NULL,
    "comments" TEXT,
    "validationSnapshot" JSONB,
    "snapshotVersion" TEXT NOT NULL,
    "scheduleSnapshotHash" TEXT,
    "lockedBOQChecksum" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT,
    "requestId" TEXT,

    CONSTRAINT "ScheduleApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleReviewComment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "reviewRound" INTEGER NOT NULL,
    "activityId" TEXT,
    "phaseId" TEXT,
    "commentType" "ScheduleCommentType" NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "ScheduleCommentStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "createdByNameSnapshot" TEXT NOT NULL,
    "createdByRoleSnapshot" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolutionComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaselineActivation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "reviewRound" INTEGER NOT NULL,
    "revisionCode" TEXT NOT NULL,
    "previousBaselineId" TEXT,
    "validationSnapshot" JSONB NOT NULL,
    "snapshotVersion" TEXT NOT NULL,
    "scheduleSnapshotHash" TEXT NOT NULL,
    "lockedBOQChecksum" TEXT,
    "activatedById" TEXT NOT NULL,
    "activatedByNameSnapshot" TEXT NOT NULL,
    "activatedByRoleSnapshot" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT,
    "requestId" TEXT,
    "isAuthoritative" BOOLEAN NOT NULL DEFAULT false,
    "invalidatedAt" TIMESTAMP(3),
    "invalidationReason" TEXT,

    CONSTRAINT "BaselineActivation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialDataWaiver" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "affectedFields" JSONB NOT NULL,
    "normalizationMethod" TEXT NOT NULL,
    "migrationDeadline" TIMESTAMP(3),
    "requestedById" TEXT NOT NULL,
    "requestedByNameSnapshot" TEXT NOT NULL,
    "requestedByRoleSnapshot" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedByNameSnapshot" TEXT,
    "approvedByRoleSnapshot" TEXT,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "FinancialWaiverStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,

    CONSTRAINT "FinancialDataWaiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleRevisionReason" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "parentScheduleId" TEXT,
    "revisionType" "ScheduleRevisionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "supportingReference" TEXT,
    "createdById" TEXT NOT NULL,
    "createdByNameSnapshot" TEXT NOT NULL,
    "createdByRoleSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleRevisionReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleWorkflowTransition" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "action" "ScheduleWorkflowAction" NOT NULL,
    "fromStatus" "ProjectScheduleWorkflowStatus" NOT NULL,
    "toStatus" "ProjectScheduleWorkflowStatus" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorSessionVersion" INTEGER NOT NULL,
    "expectedRowVersion" INTEGER NOT NULL,
    "resultingRowVersion" INTEGER NOT NULL,
    "idempotencyKeyHash" TEXT NOT NULL,
    "correlationId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "ScheduleWorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordRecoveryToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'PASSWORD_RESET',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "requestedIpHash" TEXT,
    "requestedUserAgentHash" TEXT,

    CONSTRAINT "PasswordRecoveryToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordRecoveryRateLimit" (
    "id" TEXT NOT NULL,
    "identifierHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),

    CONSTRAINT "PasswordRecoveryRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleApproval_idempotencyKey_key" ON "ScheduleApproval"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ScheduleApproval_projectId_scheduleId_idx" ON "ScheduleApproval"("projectId", "scheduleId");

-- CreateIndex
CREATE INDEX "ScheduleApproval_scheduleId_reviewRound_idx" ON "ScheduleApproval"("scheduleId", "reviewRound");

-- CreateIndex
CREATE INDEX "ScheduleApproval_scheduleId_approvalStage_idx" ON "ScheduleApproval"("scheduleId", "approvalStage");

-- CreateIndex
CREATE INDEX "ScheduleApproval_reviewerId_idx" ON "ScheduleApproval"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "BaselineActivation_idempotencyKey_key" ON "BaselineActivation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ScheduleWorkflowTransition_scheduleId_occurredAt_idx" ON "ScheduleWorkflowTransition"("scheduleId", "occurredAt");

-- CreateIndex
CREATE INDEX "ScheduleWorkflowTransition_projectId_action_occurredAt_idx" ON "ScheduleWorkflowTransition"("projectId", "action", "occurredAt");

-- CreateIndex
CREATE INDEX "ScheduleWorkflowTransition_actorUserId_occurredAt_idx" ON "ScheduleWorkflowTransition"("actorUserId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleWorkflowTransition_scheduleId_action_idempotencyKey_key" ON "ScheduleWorkflowTransition"("scheduleId", "action", "idempotencyKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordRecoveryToken_tokenHash_key" ON "PasswordRecoveryToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordRecoveryToken_userId_idx" ON "PasswordRecoveryToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordRecoveryToken_purpose_expiresAt_idx" ON "PasswordRecoveryToken"("purpose", "expiresAt");

-- CreateIndex
CREATE INDEX "PasswordRecoveryToken_tokenHash_consumedAt_revokedAt_idx" ON "PasswordRecoveryToken"("tokenHash", "consumedAt", "revokedAt");

-- CreateIndex
CREATE INDEX "PasswordRecoveryRateLimit_identifierHash_idx" ON "PasswordRecoveryRateLimit"("identifierHash");

-- CreateIndex
CREATE INDEX "ProjectSchedule_projectId_workflowStatus_idx" ON "ProjectSchedule"("projectId", "workflowStatus");

-- CreateIndex
CREATE INDEX "ProjectSchedule_parentScheduleId_idx" ON "ProjectSchedule"("parentScheduleId");

-- CreateIndex
CREATE INDEX "ProjectSchedule_previousBaselineId_idx" ON "ProjectSchedule"("previousBaselineId");

-- CreateIndex
CREATE INDEX "ProjectSchedule_lockedBOQVersionId_idx" ON "ProjectSchedule"("lockedBOQVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSchedule_id_projectId_key" ON "ProjectSchedule"("id", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSchedule_projectId_revisionNumber_key" ON "ProjectSchedule"("projectId", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSchedule_projectId_revisionCode_key" ON "ProjectSchedule"("projectId", "revisionCode");

-- AddForeignKey
ALTER TABLE "BOQMapping" ADD CONSTRAINT "BOQMapping_procurementBenchmarkItemId_fkey" FOREIGN KEY ("procurementBenchmarkItemId") REFERENCES "ProcurementBenchmarkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSchedule" ADD CONSTRAINT "ProjectSchedule_parentScheduleId_fkey" FOREIGN KEY ("parentScheduleId") REFERENCES "ProjectSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSchedule" ADD CONSTRAINT "ProjectSchedule_previousBaselineId_fkey" FOREIGN KEY ("previousBaselineId") REFERENCES "ProjectSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSchedule" ADD CONSTRAINT "ProjectSchedule_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSchedule" ADD CONSTRAINT "ProjectSchedule_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBOQAllocation" ADD CONSTRAINT "ScheduleBOQAllocation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "ScheduleActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBOQAllocation" ADD CONSTRAINT "ScheduleBOQAllocation_awardedBoqItemId_fkey" FOREIGN KEY ("awardedBoqItemId") REFERENCES "AwardedBOQItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBOQAllocation" ADD CONSTRAINT "ScheduleBOQAllocation_boqLineId_fkey" FOREIGN KEY ("boqLineId") REFERENCES "ConsolidatedBOQItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBOQAllocation" ADD CONSTRAINT "ScheduleBOQAllocation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProjectSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBOQAllocation" ADD CONSTRAINT "ScheduleBOQAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleGenerationAudit" ADD CONSTRAINT "ScheduleGenerationAudit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleGenerationAudit" ADD CONSTRAINT "ScheduleGenerationAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleApproval" ADD CONSTRAINT "ScheduleApproval_scheduleId_projectId_fkey" FOREIGN KEY ("scheduleId", "projectId") REFERENCES "ProjectSchedule"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleApproval" ADD CONSTRAINT "ScheduleApproval_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleReviewComment" ADD CONSTRAINT "ScheduleReviewComment_scheduleId_projectId_fkey" FOREIGN KEY ("scheduleId", "projectId") REFERENCES "ProjectSchedule"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleReviewComment" ADD CONSTRAINT "ScheduleReviewComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleReviewComment" ADD CONSTRAINT "ScheduleReviewComment_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaselineActivation" ADD CONSTRAINT "BaselineActivation_scheduleId_projectId_fkey" FOREIGN KEY ("scheduleId", "projectId") REFERENCES "ProjectSchedule"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaselineActivation" ADD CONSTRAINT "BaselineActivation_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDataWaiver" ADD CONSTRAINT "FinancialDataWaiver_scheduleId_projectId_fkey" FOREIGN KEY ("scheduleId", "projectId") REFERENCES "ProjectSchedule"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDataWaiver" ADD CONSTRAINT "FinancialDataWaiver_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDataWaiver" ADD CONSTRAINT "FinancialDataWaiver_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRevisionReason" ADD CONSTRAINT "ScheduleRevisionReason_scheduleId_projectId_fkey" FOREIGN KEY ("scheduleId", "projectId") REFERENCES "ProjectSchedule"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRevisionReason" ADD CONSTRAINT "ScheduleRevisionReason_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleWorkflowTransition" ADD CONSTRAINT "ScheduleWorkflowTransition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleWorkflowTransition" ADD CONSTRAINT "ScheduleWorkflowTransition_scheduleId_projectId_fkey" FOREIGN KEY ("scheduleId", "projectId") REFERENCES "ProjectSchedule"("id", "projectId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleWorkflowTransition" ADD CONSTRAINT "ScheduleWorkflowTransition_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordRecoveryToken" ADD CONSTRAINT "PasswordRecoveryToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

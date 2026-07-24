/**
 * Gate 7D-R Step 3C — Archive-to-Schema Compatibility Inventory
 * 
 * Compares the pg_restore --list output against the current Prisma schema models
 * to identify every table-data object that would fail restoration on V4.
 */
import * as fs from 'fs';

// Archive TABLE DATA objects extracted from pg_restore --list output
const archiveObjects: string[] = [
  "BillingItem", "CanvassItem", "ChatbotFeedback", "ClientVariationOrder",
  "CommitmentLedger", "ConsumptionLog", "ConsumptionItem", "CountermeasureLog",
  "PayrollPeriod", "DailyTimeRecord", "DeductionLedger", "DeductionLog",
  "DeliveryItem", "Document", "DocumentTemplate", "Equipment",
  "EquipmentAIValidation", "EquipmentDeployment", "EquipmentMaintenance",
  "EquipmentTelemetry", "EquipmentUtilization", "ExecutiveAccessLog",
  "ExecutiveAlertLog", "ExecutiveDashboardPreference", "Expense",
  "ExpenseAIValidation", "ExpenseApprovalLog", "ExpenseBreakdownItem",
  "ExpenseProofFile", "FileSecurityLog", "FleetEvent", "FleetAIReview",
  "FleetTrip", "Geofence", "GovernmentSettings", "HikvisionDevice",
  "Inspection", "MaterialIssuance", "IssuanceItem", "KnowledgeRecord",
  "KnowledgeAuditTrail", "KnowledgeReference", "KnowledgeRuleAuditLog",
  "KnowledgeRuleReference", "ProjectCamera", "LiveCameraSnapshot",
  "LockedRecord", "MaterialRequestItem", "MaterialReturn", "Module",
  "NotebookReferenceApprovalLog", "NotebookReferenceIndexLog",
  "NotebookReferenceModule", "NotebookReferenceProject",
  "NotebookReferenceRole", "WorkbookVersion", "OnlyOfficeSession",
  "Payment", "PaymentProvider", "PayrollBankAccount", "PaymentBatch",
  "Payroll", "PaymentBatchRow", "PaymentException",
  "PaymentFallbackRecommendation", "PaymentLog",
  "SubcontractBilling", "PaymentRecord", "PayrollApproval",
  "PayrollAuditLog", "PayrollBankLedger", "PayrollCutoffSetting",
  "PayrollDeduction", "PayrollEarning", "PayrollFundingRequest",
  "PettyCashAccount", "PettyCashReplenishment", "PettyCashExpense",
  "ProgramOfWorks", "ProjectAccomplishmentFile",
  "ProjectAccomplishmentAIFinding", "ProjectAccomplishmentFileVersion",
  "ProjectBOQVersion", "ProjectCostLedger", "ProjectSchedule",
  "ProjectUserAssignment", "ProjectValidationScore",
  "PurchaseOrderItem", "SupplierQuotation", "QuotationItem",
  "ReceivingBank", "ReturnItem", "RevisionRequest", "Role",
  "RoleConflictRule", "RolePermission", "SSSTable",
  "ScheduleWBS", "ScheduleActivity", "ScheduleBOQMapping",
  "ScheduleDelayRecord", "ScheduleDependency", "ScheduleMilestone",
  "SchedulePOWMapping", "ScheduleProgressUpdate",
  "ScheduleRecoveryPlan", "ScheduleRevisionRequest",
  "SecuritySimulationCampaign", "SecuritySimulationScenario",
  "SecuritySimulationRun", "SecurityIncident", "SecurityEvent",
  "SecurityRule", "SecuritySimulationArchive", "SensitiveExportLog",
  "SubcontractAccomplishment", "SubcontractorBOQItem",
  "SubcontractorVariationOrder", "SystemRole", "ThreatIp",
  "TransactionWorkflow", "UserLoginLog", "UserRole",
  "UserSessionSecurityLog", "ValidationAuditLog",
  "ValidationEvidencePack", "ValidationSettings",
  "ValueEngineeringRecord", "VariationOrderApproval",
  "VariationOrderDocument", "VariationOrderItem", "VideoEvidence",
  "WorkbookExtractionAudit", "WorkbookFormulaValidation",
  "WorkbookTemplateValidation", "WorkerDocument", "WorkflowTemplate",
  "WorkflowStep", "_prisma_migrations"
];

// Current V4 schema models (from `findstr /B "model " prisma/schema.prisma`)
const schemaModels: string[] = [
  "User", "SystemRole", "Project", "ProjectUserAssignment",
  "AwardedBOQItem", "ProcurementBenchmarkItem", "ConsolidatedBOQItem",
  "BOQMapping", "Supplier", "MaterialRequest", "MaterialRequestItem",
  "PurchaseOrder", "PurchaseOrderItem", "Expense", "ExpenseBreakdownItem",
  "ExpenseProofFile", "ExpenseAIValidation", "ExpenseApprovalLog",
  "PettyCashAccount", "PettyCashExpense", "PettyCashReplenishment",
  "Worker", "AIWorkerValidationResult", "WorkerDocument",
  "DailyTimeRecord", "PayrollPeriod", "Payroll", "PayrollEarning",
  "PayrollDeduction", "PayrollApproval", "DeductionLedger",
  "DeductionLog", "Allowance", "GovernmentSettings", "SSSTable",
  "BIRWithholdingTaxTable", "PayrollAuditLog", "Document",
  "Delivery", "DeliveryItem", "ConsumptionLog", "ConsumptionItem",
  "MaterialIssuance", "IssuanceItem", "MaterialReturn", "ReturnItem",
  "AccountsPayable", "BOQLotBreakdown", "Accomplishment",
  "AccomplishmentItem", "Inspection", "Billing", "BillingItem",
  "BillingDeduction", "Payment", "VariationOrder",
  "VariationOrderItem", "VariationOrderDocument",
  "VariationOrderApproval", "AIVariationOrderValidation",
  "EvidenceFile", "ProjectCamera", "LiveCameraSnapshot",
  "AIValidationRun", "AIValidationEvidence", "AIValidationFinding",
  "AIDuplicatePhotoCheck", "AIHumanReview", "Subcontractor",
  "ProgramOfWorks", "SubcontractorBOQItem", "AccomplishmentRecord",
  "PaymentRecord", "AIValidationResult", "SubcontractPackage",
  "JobOrder", "SubcontractAccomplishment", "SubcontractBilling",
  "BackCharge", "PayrollCutoffSetting", "KnowledgeRecord",
  "KnowledgeReference", "KnowledgeAuditTrail", "PayrollBankAccount",
  "PayrollBankLedger", "PayrollFundingRequest", "PaymentBatch",
  "PaymentBatchRow", "PaymentException", "PaymentProvider",
  "ReceivingBank", "PaymentFallbackRecommendation",
  "DocumentTemplate", "ProjectAccomplishmentFile",
  "ProjectAccomplishmentFileVersion",
  "ProjectAccomplishmentAIFinding", "KnowledgeRuleReference",
  "KnowledgeRuleAuditLog", "Role", "UserRole", "Module",
  "RolePermission", "WorkflowTemplate", "WorkflowStep",
  "TransactionWorkflow", "AuditLog", "AIValidationLog",
  "LockedRecord", "RevisionRequest", "PaymentLog", "UserLoginLog",
  "RoleConflictRule", "AINotebookReference", "NotebookReference",
  "NotebookReferenceVersion", "NotebookReferenceModule",
  "NotebookReferenceRole", "NotebookReferenceProject",
  "NotebookReferenceApprovalLog", "NotebookReferenceIndexLog",
  "AIValidationRule", "AITransactionValidation",
  "AIValidationOverride", "AIRiskScore", "AIModulePrompt",
  "AIAuditFinding", "AISearchLog", "AINotification",
  "AIReferenceUsageLog", "CanvassForm", "CanvassItem",
  "SupplierQuotation", "QuotationItem", "Equipment",
  "EquipmentDeployment", "EquipmentUtilization",
  "EquipmentMaintenance", "EquipmentTelemetry",
  "EquipmentAIValidation", "HikvisionDevice", "FleetEvent",
  "VideoEvidence", "FleetTrip", "Geofence", "FleetAIReview",
  "ExecutiveDashboardPreference", "ExecutiveAlertLog",
  "ExecutiveAccessLog", "AIExecutiveQuery", "AIGeneratedReport",
  "AIGeneratedReportVersion", "ValidationSettings",
  "AIValidationRecord", "ProjectValidationScore",
  "ValidationEvidencePack", "ValidationAuditLog",
  "ProjectCostLedger", "CommitmentLedger",
  "SubcontractorVariationOrder", "ClientVariationOrder",
  "ValueEngineeringRecord", "ProjectSchedule", "ScheduleWBS",
  "ScheduleActivity", "ScheduleDependency", "ScheduleMilestone",
  "ScheduleBOQAllocation", "SchedulePOWMapping",
  "ScheduleProgressUpdate", "ScheduleDelayRecord",
  "ScheduleRecoveryPlan", "ScheduleRevisionRequest",
  "AiKnowledgeSource", "AiKnowledgeChunk", "AiChatSession",
  "AiChatMessage", "AiAccessAuditLog", "AiIndexingJob",
  "ChatbotFeedback", "AiRagKeywordRegistry", "AiRagSchemaMap",
  "AiRagEmbedding", "AiKnowledgeMap", "AiComparisonMap",
  "AiUiActionRegistry", "AiSystemEnumRegistry",
  "AiRagNoiseExclusion", "AiRegistryCleanupReport",
  "SecurityEvent", "SecurityIncident", "SecurityRule",
  "UserSessionSecurityLog", "AIQuerySecurityLog",
  "FileSecurityLog", "ThreatIp", "CountermeasureLog",
  "SensitiveExportLog", "SecuritySimulationScenario",
  "SecuritySimulationCampaign", "SecuritySimulationRun",
  "SecuritySimulationArchive", "UploadedWorkbookFile",
  "WorkbookVersion", "OnlyOfficeSession", "BOQExtractedSection",
  "BOQExtractedItem", "WorkbookFormulaValidation",
  "WorkbookTemplateValidation", "ProjectBOQVersion",
  "ScheduleGenerationAudit", "WorkbookExtractionAudit",
  "AIConfiguration", "ScheduleApproval", "ScheduleReviewComment",
  "BaselineActivation", "FinancialDataWaiver", "ScheduleRevisionReason"
];

// Build analysis
const missingFromSchema: string[] = [];
const compatible: string[] = [];
const specialCases: { name: string; reason: string }[] = [];

for (const obj of archiveObjects) {
  if (obj === '_prisma_migrations') {
    specialCases.push({
      name: obj,
      reason: 'Prisma migration tracking table — must be evaluated for inclusion/exclusion based on restore strategy'
    });
    continue;
  }
  if (schemaModels.includes(obj)) {
    compatible.push(obj);
  } else {
    missingFromSchema.push(obj);
  }
}

// Also check archive for tables missing that exist in schema
const archiveTablesSet = new Set(archiveObjects);
const missingFromArchive = schemaModels.filter(m => !archiveTablesSet.has(m));

const report = {
  timestamp: new Date().toISOString(),
  archiveFile: 'backups/scheduling-reconstruction-sanitized-pre-gate7-data.dump',
  archiveObjectCount: archiveObjects.length,
  schemaModelCount: schemaModels.length,
  compatible: {
    count: compatible.length,
    tables: compatible
  },
  missingFromSchema: {
    count: missingFromSchema.length,
    tables: missingFromSchema,
    note: 'These archive TABLE DATA objects reference tables that do NOT exist in the current V4 Prisma schema'
  },
  missingFromArchive: {
    count: missingFromArchive.length,
    tables: missingFromArchive,
    note: 'These V4 schema models have no matching TABLE DATA in the archive (expected for new tables or tables with no data)'
  },
  specialCases
};

fs.writeFileSync('artifacts/scheduling/uat-v4-compatible-schema-inventory.json', JSON.stringify(report, null, 2));

console.log('=== ARCHIVE-TO-SCHEMA COMPATIBILITY INVENTORY ===');
console.log(`Archive objects: ${archiveObjects.length}`);
console.log(`Schema models: ${schemaModels.length}`);
console.log(`Compatible: ${compatible.length}`);
console.log(`Missing from V4 schema (INCOMPATIBLE): ${missingFromSchema.length}`);
missingFromSchema.forEach(t => console.log(`  - ${t}`));
console.log(`Missing from archive (new/empty in schema): ${missingFromArchive.length}`);
missingFromArchive.forEach(t => console.log(`  - ${t}`));
console.log(`Special cases: ${specialCases.length}`);
specialCases.forEach(s => console.log(`  - ${s.name}: ${s.reason}`));

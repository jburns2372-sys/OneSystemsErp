const fs = require('fs');

const tables = [
  {
    name: 'BOQExtractedItem',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'uploadedWorkbookFileId', type: 'text', nullable: false, default: null },
      { name: 'projectId', type: 'text', nullable: false, default: null },
      { name: 'sectionId', type: 'text', nullable: true, default: null },
      { name: 'sheetName', type: 'text', nullable: true, default: null },
      { name: 'sourceRowNumber', type: 'integer', nullable: true, default: null },
      { name: 'itemNumber', type: 'text', nullable: true, default: null },
      { name: 'description', type: 'text', nullable: false, default: null },
      { name: 'unit', type: 'text', nullable: true, default: null },
      { name: 'quantity', type: 'double precision', nullable: true, default: null },
      { name: 'materialUnitCost', type: 'double precision', nullable: true, default: null },
      { name: 'laborUnitCost', type: 'double precision', nullable: true, default: null },
      { name: 'equipmentUnitCost', type: 'double precision', nullable: true, default: null },
      { name: 'totalDirectCost', type: 'double precision', nullable: true, default: null },
      { name: 'ocm', type: 'double precision', nullable: true, default: null },
      { name: 'cp', type: 'double precision', nullable: true, default: null },
      { name: 'vat', type: 'double precision', nullable: true, default: null },
      { name: 'totalIndirectCost', type: 'double precision', nullable: true, default: null },
      { name: 'unitCost', type: 'double precision', nullable: true, default: null },
      { name: 'amount', type: 'double precision', nullable: true, default: null },
      { name: 'percentage', type: 'double precision', nullable: true, default: null },
      { name: 'formulaMapJson', type: 'text', nullable: true, default: null },
      { name: 'validationStatus', type: 'text', nullable: false, default: "'PENDING'" },
      { name: 'validationErrorsJson', type: 'text', nullable: true, default: null },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: 'timestamp without time zone', nullable: false, default: null }
    ]
  },
  {
    name: 'BOQExtractedSection',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'uploadedWorkbookFileId', type: 'text', nullable: false, default: null },
      { name: 'projectId', type: 'text', nullable: false, default: null },
      { name: 'sheetName', type: 'text', nullable: true, default: null },
      { name: 'sourceRowNumber', type: 'integer', nullable: true, default: null },
      { name: 'sectionCode', type: 'text', nullable: true, default: null },
      { name: 'sectionName', type: 'text', nullable: false, default: null },
      { name: 'displayOrder', type: 'integer', nullable: false, default: "0" },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: 'timestamp without time zone', nullable: false, default: null }
    ]
  },
  {
    name: 'OnlyOfficeSession',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'uploadedWorkbookFileId', type: 'text', nullable: false, default: null },
      { name: 'projectId', type: 'text', nullable: false, default: null },
      { name: 'workbookVersionId', type: 'text', nullable: true, default: null },
      { name: 'documentKey', type: 'text', nullable: false, default: null },
      { name: 'mode', type: 'text', nullable: false, default: "'view'" },
      { name: 'userId', type: 'text', nullable: false, default: null },
      { name: 'userName', type: 'text', nullable: true, default: null },
      { name: 'permissionsJson', type: 'text', nullable: true, default: null },
      { name: 'configJson', type: 'text', nullable: true, default: null },
      { name: 'status', type: 'text', nullable: false, default: "'ACTIVE'" },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'expiresAt', type: 'timestamp without time zone', nullable: true, default: null },
      { name: 'lastCallbackAt', type: 'timestamp without time zone', nullable: true, default: null }
    ]
  },
  {
    name: 'ProjectBOQVersion',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'projectId', type: 'text', nullable: false, default: null },
      { name: 'sourceUploadedWorkbookFileId', type: 'text', nullable: true, default: null },
      { name: 'versionNumber', type: 'integer', nullable: false, default: null },
      { name: 'versionLabel', type: 'text', nullable: true, default: null },
      { name: 'status', type: 'text', nullable: false, default: "'DRAFT'" },
      { name: 'committedBy', type: 'text', nullable: true, default: null },
      { name: 'committedAt', type: 'timestamp without time zone', nullable: true, default: null },
      { name: 'approvedBy', type: 'text', nullable: true, default: null },
      { name: 'approvedAt', type: 'timestamp without time zone', nullable: true, default: null },
      { name: 'totalDirectCost', type: 'double precision', nullable: true, default: null },
      { name: 'totalIndirectCost', type: 'double precision', nullable: true, default: null },
      { name: 'totalAmount', type: 'double precision', nullable: true, default: null },
      { name: 'remarks', type: 'text', nullable: true, default: null },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: 'timestamp without time zone', nullable: false, default: null }
    ]
  },
  {
    name: 'SecuritySimulationArchive',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'archiveNumber', type: 'text', nullable: false, default: null },
      { name: 'simulationRunId', type: 'text', nullable: true, default: null },
      { name: 'campaignId', type: 'text', nullable: true, default: null },
      { name: 'scenarioName', type: 'text', nullable: true, default: null },
      { name: 'runMode', type: 'text', nullable: true, default: null },
      { name: 'environment', type: 'text', nullable: true, default: null },
      { name: 'initiatedBy', type: 'text', nullable: true, default: null },
      { name: 'clearedBy', type: 'text', nullable: true, default: null },
      { name: 'startedAt', type: 'timestamp without time zone', nullable: true, default: null },
      { name: 'completedAt', type: 'timestamp without time zone', nullable: true, default: null },
      { name: 'clearedAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'totalEventsArchived', type: 'integer', nullable: true, default: null },
      { name: 'totalIncidentsArchived', type: 'integer', nullable: true, default: null },
      { name: 'totalCountermeasuresArchived', type: 'integer', nullable: true, default: null },
      { name: 'detectionScore', type: 'double precision', nullable: true, default: null },
      { name: 'responseScore', type: 'double precision', nullable: true, default: null },
      { name: 'evidenceScore', type: 'double precision', nullable: true, default: null },
      { name: 'finalScore', type: 'double precision', nullable: true, default: null },
      { name: 'overallResult', type: 'text', nullable: true, default: null },
      { name: 'archiveJson', type: 'text', nullable: true, default: null },
      { name: 'exportedPdfUrl', type: 'text', nullable: true, default: null },
      { name: 'exportedExcelUrl', type: 'text', nullable: true, default: null },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" }
    ]
  },
  {
    name: 'SecuritySimulationCampaign',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'name', type: 'text', nullable: false, default: null },
      { name: 'description', type: 'text', nullable: true, default: null },
      { name: 'severity', type: 'text', nullable: false, default: null },
      { name: 'scenarioSequenceJson', type: 'text', nullable: false, default: null },
      { name: 'status', type: 'text', nullable: false, default: null },
      { name: 'createdBy', type: 'text', nullable: true, default: null },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: 'timestamp without time zone', nullable: false, default: null }
    ]
  },
  {
    name: 'SecuritySimulationRun',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'scenarioId', type: 'text', nullable: true, default: null },
      { name: 'campaignId', type: 'text', nullable: true, default: null },
      { name: 'runMode', type: 'text', nullable: false, default: null },
      { name: 'environment', type: 'text', nullable: false, default: null },
      { name: 'status', type: 'text', nullable: false, default: null },
      { name: 'initiatedBy', type: 'text', nullable: true, default: null },
      { name: 'startedAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'completedAt', type: 'timestamp without time zone', nullable: true, default: null },
      { name: 'detectionScore', type: 'double precision', nullable: true, default: null },
      { name: 'responseScore', type: 'double precision', nullable: true, default: null },
      { name: 'evidenceScore', type: 'double precision', nullable: true, default: null },
      { name: 'finalScore', type: 'double precision', nullable: true, default: null },
      { name: 'overallResult', type: 'text', nullable: true, default: null },
      { name: 'notes', type: 'text', nullable: true, default: null }
    ]
  },
  {
    name: 'SecuritySimulationScenario',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'name', type: 'text', nullable: false, default: null },
      { name: 'description', type: 'text', nullable: true, default: null },
      { name: 'category', type: 'text', nullable: false, default: null },
      { name: 'severity', type: 'text', nullable: false, default: null },
      { name: 'targetModule', type: 'text', nullable: false, default: null },
      { name: 'targetRoute', type: 'text', nullable: true, default: null },
      { name: 'simulatedRole', type: 'text', nullable: true, default: null },
      { name: 'simulatedSourceIp', type: 'text', nullable: true, default: null },
      { name: 'simulatedCountry', type: 'text', nullable: true, default: null },
      { name: 'simulatedCity', type: 'text', nullable: true, default: null },
      { name: 'latitude', type: 'double precision', nullable: true, default: null },
      { name: 'longitude', type: 'double precision', nullable: true, default: null },
      { name: 'mitreTechnique', type: 'text', nullable: true, default: null },
      { name: 'owaspCategory', type: 'text', nullable: true, default: null },
      { name: 'expectedDetection', type: 'text', nullable: true, default: null },
      { name: 'expectedCountermeasure', type: 'text', nullable: true, default: null },
      { name: 'passFailCriteria', type: 'text', nullable: true, default: null },
      { name: 'enabled', type: 'boolean', nullable: false, default: "true" },
      { name: 'createdBy', type: 'text', nullable: true, default: null },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: 'timestamp without time zone', nullable: false, default: null }
    ]
  },
  {
    name: 'UploadedWorkbookFile',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'projectId', type: 'text', nullable: false, default: null },
      { name: 'originalFilename', type: 'text', nullable: false, default: null },
      { name: 'fileHash', type: 'text', nullable: false, default: null },
      { name: 'storagePath', type: 'text', nullable: false, default: null },
      { name: 'preservedOriginalUrl', type: 'text', nullable: true, default: null },
      { name: 'uploadedBy', type: 'text', nullable: false, default: null },
      { name: 'uploadedAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'recognizedTemplate', type: 'text', nullable: true, default: null },
      { name: 'validationStatus', type: 'text', nullable: false, default: "'PENDING'" },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: 'timestamp without time zone', nullable: false, default: null },
      { name: 'commitStatus', type: 'text', nullable: false, default: "'PENDING'" },
      { name: 'documentType', type: 'text', nullable: true, default: null },
      { name: 'extractionStatus', type: 'text', nullable: false, default: "'PENDING'" },
      { name: 'fileSize', type: 'integer', nullable: false, default: null },
      { name: 'latestPreservedVersionId', type: 'text', nullable: true, default: null },
      { name: 'metadataJson', type: 'text', nullable: true, default: null },
      { name: 'mimeType', type: 'text', nullable: false, default: null },
      { name: 'onlyOfficeDocumentKey', type: 'text', nullable: true, default: null },
      { name: 'templateCode', type: 'text', nullable: true, default: null },
      { name: 'templateName', type: 'text', nullable: true, default: null },
      { name: 'templateVersion', type: 'text', nullable: true, default: null }
    ]
  },
  {
    name: 'WorkbookExtractionAudit',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'uploadedWorkbookFileId', type: 'text', nullable: false, default: null },
      { name: 'projectId', type: 'text', nullable: false, default: null },
      { name: 'action', type: 'text', nullable: false, default: null },
      { name: 'status', type: 'text', nullable: false, default: "'SUCCESS'" },
      { name: 'message', type: 'text', nullable: true, default: null },
      { name: 'detailsJson', type: 'text', nullable: true, default: null },
      { name: 'performedBy', type: 'text', nullable: true, default: null },
      { name: 'performedAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'ipAddress', type: 'text', nullable: true, default: null },
      { name: 'performedByRole', type: 'text', nullable: true, default: null },
      { name: 'userAgent', type: 'text', nullable: true, default: null }
    ]
  },
  {
    name: 'WorkbookFormulaValidation',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'uploadedWorkbookFileId', type: 'text', nullable: false, default: null },
      { name: 'sheetName', type: 'text', nullable: true, default: null },
      { name: 'cellAddress', type: 'text', nullable: false, default: null },
      { name: 'sourceRowNumber', type: 'integer', nullable: true, default: null },
      { name: 'expectedFormula', type: 'text', nullable: true, default: null },
      { name: 'actualFormula', type: 'text', nullable: true, default: null },
      { name: 'validationStatus', type: 'text', nullable: false, default: "'PENDING'" },
      { name: 'message', type: 'text', nullable: true, default: null },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'projectId', type: 'text', nullable: false, default: null },
      { name: 'severity', type: 'text', nullable: false, default: "'INFO'" },
      { name: 'actualValue', type: 'double precision', nullable: true, default: null },
      { name: 'expectedValue', type: 'double precision', nullable: true, default: null }
    ]
  },
  {
    name: 'WorkbookTemplateValidation',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'uploadedWorkbookFileId', type: 'text', nullable: false, default: null },
      { name: 'projectId', type: 'text', nullable: false, default: null },
      { name: 'validationType', type: 'text', nullable: false, default: null },
      { name: 'validationKey', type: 'text', nullable: false, default: null },
      { name: 'expectedValue', type: 'text', nullable: true, default: null },
      { name: 'actualValue', type: 'text', nullable: true, default: null },
      { name: 'severity', type: 'text', nullable: false, default: "'INFO'" },
      { name: 'status', type: 'text', nullable: false, default: "'PENDING'" },
      { name: 'message', type: 'text', nullable: true, default: null },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" }
    ]
  },
  {
    name: 'WorkbookVersion',
    pk: 'id',
    columns: [
      { name: 'id', type: 'text', nullable: false, default: null },
      { name: 'uploadedWorkbookFileId', type: 'text', nullable: false, default: null },
      { name: 'projectId', type: 'text', nullable: false, default: null },
      { name: 'versionNumber', type: 'integer', nullable: false, default: null },
      { name: 'versionLabel', type: 'text', nullable: true, default: null },
      { name: 'sourceType', type: 'text', nullable: false, default: null },
      { name: 'filePath', type: 'text', nullable: false, default: null },
      { name: 'fileHash', type: 'text', nullable: false, default: null },
      { name: 'createdBy', type: 'text', nullable: false, default: null },
      { name: 'createdAt', type: 'timestamp without time zone', nullable: false, default: "CURRENT_TIMESTAMP" },
      { name: 'remarks', type: 'text', nullable: true, default: null }
    ]
  }
];

const fks = [
  { table: 'BOQExtractedItem', constraint: 'BOQExtractedItem_projectId_fkey', col: 'projectId', refTable: 'Project', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'BOQExtractedItem', constraint: 'BOQExtractedItem_sectionId_fkey', col: 'sectionId', refTable: 'BOQExtractedSection', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'BOQExtractedItem', constraint: 'BOQExtractedItem_uploadedWorkbookFileId_fkey', col: 'uploadedWorkbookFileId', refTable: 'UploadedWorkbookFile', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'BOQExtractedSection', constraint: 'BOQExtractedSection_projectId_fkey', col: 'projectId', refTable: 'Project', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'BOQExtractedSection', constraint: 'BOQExtractedSection_uploadedWorkbookFileId_fkey', col: 'uploadedWorkbookFileId', refTable: 'UploadedWorkbookFile', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'BOQMapping', constraint: 'BOQMapping_procurementBenchmarkItemId_fkey', col: 'procurementBenchmarkItemId', refTable: 'ProcurementBenchmarkItem', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'OnlyOfficeSession', constraint: 'OnlyOfficeSession_uploadedWorkbookFileId_fkey', col: 'uploadedWorkbookFileId', refTable: 'UploadedWorkbookFile', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'OnlyOfficeSession', constraint: 'OnlyOfficeSession_workbookVersionId_fkey', col: 'workbookVersionId', refTable: 'WorkbookVersion', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'SecurityEvent', constraint: 'SecurityEvent_simulationRunId_fkey', col: 'simulationRunId', refTable: 'SecuritySimulationRun', refCol: 'id', onDelete: 'SET NULL', onUpdate: 'CASCADE' },
  { table: 'SecurityIncident', constraint: 'SecurityIncident_linkedSimulationRunId_fkey', col: 'linkedSimulationRunId', refTable: 'SecuritySimulationRun', refCol: 'id', onDelete: 'SET NULL', onUpdate: 'CASCADE' },
  { table: 'SecuritySimulationRun', constraint: 'SecuritySimulationRun_campaignId_fkey', col: 'campaignId', refTable: 'SecuritySimulationCampaign', refCol: 'id', onDelete: 'SET NULL', onUpdate: 'CASCADE' },
  { table: 'SecuritySimulationRun', constraint: 'SecuritySimulationRun_scenarioId_fkey', col: 'scenarioId', refTable: 'SecuritySimulationScenario', refCol: 'id', onDelete: 'SET NULL', onUpdate: 'CASCADE' },
  { table: 'UploadedWorkbookFile', constraint: 'UploadedWorkbookFile_projectId_fkey', col: 'projectId', refTable: 'Project', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'WorkbookExtractionAudit', constraint: 'WorkbookExtractionAudit_projectId_fkey', col: 'projectId', refTable: 'Project', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'WorkbookExtractionAudit', constraint: 'WorkbookExtractionAudit_uploadedWorkbookFileId_fkey', col: 'uploadedWorkbookFileId', refTable: 'UploadedWorkbookFile', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'WorkbookFormulaValidation', constraint: 'WorkbookFormulaValidation_uploadedWorkbookFileId_fkey', col: 'uploadedWorkbookFileId', refTable: 'UploadedWorkbookFile', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'WorkbookTemplateValidation', constraint: 'WorkbookTemplateValidation_uploadedWorkbookFileId_fkey', col: 'uploadedWorkbookFileId', refTable: 'UploadedWorkbookFile', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  { table: 'WorkbookVersion', constraint: 'WorkbookVersion_uploadedWorkbookFileId_fkey', col: 'uploadedWorkbookFileId', refTable: 'UploadedWorkbookFile', refCol: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }
];

const indexes = [
  { name: 'OnlyOfficeSession_documentKey_key', table: 'OnlyOfficeSession', col: 'documentKey' }
];

const lines = [];

lines.push("CREATE OR REPLACE FUNCTION _reconcile_check_column(");
lines.push("    p_table text, p_column text, p_type text, p_nullable boolean, p_default text");
lines.push(") RETURNS void AS $$");
lines.push("DECLARE");
lines.push("    v_type text;");
lines.push("    v_nullable boolean;");
lines.push("    v_default text;");
lines.push("BEGIN");
lines.push("    SELECT data_type, (is_nullable = 'YES'), column_default");
lines.push("    INTO v_type, v_nullable, v_default");
lines.push("    FROM information_schema.columns");
lines.push("    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column;");
lines.push("");
lines.push("    IF NOT FOUND THEN");
lines.push("        RAISE EXCEPTION 'Column %.% is missing', p_table, p_column;");
lines.push("    END IF;");
lines.push("");
lines.push("    IF v_type != p_type THEN");
lines.push("        RAISE EXCEPTION 'Column %.% type mismatch: expected %, got %', p_table, p_column, p_type, v_type;");
lines.push("    END IF;");
lines.push("");
lines.push("    IF v_nullable != p_nullable THEN");
lines.push("        RAISE EXCEPTION 'Column %.% nullability mismatch: expected %, got %', p_table, p_column, p_nullable, v_nullable;");
lines.push("    END IF;");
lines.push("END;");
lines.push("$$ LANGUAGE plpgsql;");

lines.push("");
lines.push("CREATE OR REPLACE FUNCTION _reconcile_check_fk(");
lines.push("    p_table text, p_constraint text, p_col text, p_ref_table text, p_ref_col text, p_on_delete text, p_on_update text");
lines.push(") RETURNS void AS $$");
lines.push("DECLARE");
lines.push("    v_ref_table text;");
lines.push("BEGIN");
lines.push("    SELECT ccu.table_name INTO v_ref_table");
lines.push("    FROM information_schema.table_constraints tc");
lines.push("    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name");
lines.push("    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = p_table AND tc.constraint_name = p_constraint;");
lines.push("");
lines.push("    IF NOT FOUND THEN");
lines.push("        RAISE EXCEPTION 'Foreign key % on % is missing', p_constraint, p_table;");
lines.push("    END IF;");
lines.push("");
lines.push("    IF v_ref_table != p_ref_table THEN");
lines.push("        RAISE EXCEPTION 'Foreign key % targets wrong table: expected %, got %', p_constraint, p_ref_table, v_ref_table;");
lines.push("    END IF;");
lines.push("END;");
lines.push("$$ LANGUAGE plpgsql;");

lines.push("");
lines.push("CREATE OR REPLACE FUNCTION _reconcile_check_idx(");
lines.push("    p_name text, p_table text, p_col text");
lines.push(") RETURNS void AS $$");
lines.push("DECLARE");
lines.push("    v_exists boolean;");
lines.push("BEGIN");
lines.push("    SELECT EXISTS (");
lines.push("        SELECT 1 FROM pg_indexes WHERE tablename = p_table AND indexname = p_name");
lines.push("    ) INTO v_exists;");
lines.push("");
lines.push("    IF NOT v_exists THEN");
lines.push("        RAISE EXCEPTION 'Index % on % is missing', p_name, p_table;");
lines.push("    END IF;");
lines.push("END;");
lines.push("$$ LANGUAGE plpgsql;");

lines.push("");
lines.push("DO $$");
lines.push("BEGIN");

lines.push(`    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='BOQMapping' AND column_name='procurementBenchmarkItemId') THEN
        ALTER TABLE "public"."BOQMapping" ADD COLUMN "procurementBenchmarkItemId" TEXT;
    END IF;
    PERFORM _reconcile_check_column('BOQMapping', 'procurementBenchmarkItemId', 'text', true, null);`);

lines.push(`    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='BOQMapping' AND column_name='awardedBoqItemId' AND is_nullable='NO') THEN
        ALTER TABLE "public"."BOQMapping" ALTER COLUMN "awardedBoqItemId" DROP NOT NULL;
    END IF;
    PERFORM _reconcile_check_column('BOQMapping', 'awardedBoqItemId', 'text', true, null);`);

lines.push(`    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='CountermeasureLog' AND column_name='actualResult') THEN
        ALTER TABLE "public"."CountermeasureLog" ADD COLUMN "actualResult" TEXT, ADD COLUMN "expectedResult" TEXT, ADD COLUMN "passed" BOOLEAN, ADD COLUMN "responseTimeMs" INTEGER;
    END IF;
    PERFORM _reconcile_check_column('CountermeasureLog', 'actualResult', 'text', true, null);`);

lines.push(`    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SecurityEvent' AND column_name='actualResponse') THEN
        ALTER TABLE "public"."SecurityEvent" ADD COLUMN "actualResponse" TEXT, ADD COLUMN "expectedResponse" TEXT, ADD COLUMN "simulationPassed" BOOLEAN, ADD COLUMN "simulationRunId" TEXT;
    END IF;
    PERFORM _reconcile_check_column('SecurityEvent', 'actualResponse', 'text', true, null);`);

lines.push(`    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SecurityIncident' AND column_name='evidenceJson') THEN
        ALTER TABLE "public"."SecurityIncident" ADD COLUMN "evidenceJson" TEXT, ADD COLUMN "linkedSimulationRunId" TEXT, ADD COLUMN "timelineJson" TEXT;
    END IF;
    PERFORM _reconcile_check_column('SecurityIncident', 'evidenceJson', 'text', true, null);`);

for (let table of tables) {
  let createSql = `    CREATE TABLE "public"."${table.name}" (\n`;
  createSql += table.columns.map(c => {
    let t = c.type === 'text' ? 'TEXT' : c.type === 'integer' ? 'INTEGER' : c.type === 'double precision' ? 'DOUBLE PRECISION' : c.type === 'boolean' ? 'BOOLEAN' : 'TIMESTAMP(3)';
    return `        "${c.name}" ${t} ${c.nullable ? '' : 'NOT NULL'}${c.default ? ' DEFAULT ' + c.default : ''}`;
  }).join(',\n');
  if (table.pk) {
    createSql += `,\n        CONSTRAINT "${table.name}_pkey" PRIMARY KEY ("${table.pk}")`;
  }
  createSql += `\n    );`;
  
  lines.push(`    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='${table.name}') THEN`);
  lines.push(createSql);
  lines.push(`    END IF;`);
  
  for (let c of table.columns) {
      let defStr = c.default ? "'" + c.default.replace(/'/g, "''") + "'" : 'null';
      lines.push(`    PERFORM _reconcile_check_column('${table.name}', '${c.name}', '${c.type}', ${c.nullable}, ${defStr});`);
  }
}

for (let fk of fks) {
  lines.push(`    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='${fk.constraint}' AND table_name='${fk.table}') THEN`);
  lines.push(`        ALTER TABLE "public"."${fk.table}" ADD CONSTRAINT "${fk.constraint}" FOREIGN KEY ("${fk.col}") REFERENCES "public"."${fk.refTable}"("${fk.refCol}") ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate};`);
  lines.push(`    END IF;`);
  lines.push(`    PERFORM _reconcile_check_fk('${fk.table}', '${fk.constraint}', '${fk.col}', '${fk.refTable}', '${fk.refCol}', '${fk.onDelete}', '${fk.onUpdate}');`);
}

for (let idx of indexes) {
  lines.push(`    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '${idx.name}') THEN`);
  lines.push(`        CREATE UNIQUE INDEX "${idx.name}" ON "public"."${idx.table}"("${idx.col}" ASC);`);
  lines.push(`    END IF;`);
  lines.push(`    PERFORM _reconcile_check_idx('${idx.name}', '${idx.table}', '${idx.col}');`);
}

lines.push("END;");
lines.push("$$;");
lines.push("");
lines.push("DROP FUNCTION _reconcile_check_column;");
lines.push("DROP FUNCTION _reconcile_check_fk;");
lines.push("DROP FUNCTION _reconcile_check_idx;");

const fsOut = require('fs');
fsOut.writeFileSync('prisma/migrations/20260714_reconcile_pre_phase3_schema_drift/migration.sql', lines.join('\n'));
console.log('Migration strictly rewritten.');

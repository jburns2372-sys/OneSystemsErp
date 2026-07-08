const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Replace UploadedWorkbookFile
const uploadedWorkbookFileOld = `model UploadedWorkbookFile {
  id                   String                    @id @default(cuid())
  templateId           String?
  template             UploadedDocumentTemplate? @relation(fields: [templateId], references: [id])
  projectId            String
  project              Project                   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  originalFilename     String
  fileHash             String?
  storagePath          String
  preservedOriginalUrl String?
  uploadedBy           String?
  uploadedAt           DateTime                  @default(now())
  recognizedTemplate   Boolean                   @default(false)
  validationStatus     String                    @default("PENDING")
  validationErrorsJson String?
  workbookMetadataJson String?
  status               String                    @default("DRAFT")
  createdAt            DateTime                  @default(now())
  updatedAt            DateTime                  @updatedAt

  cellSnapshots      WorkbookCellSnapshot[]
  layoutSnapshots    WorkbookLayoutSnapshot[]
  extractedSections  BOQExtractedSection[]
  extractedItems     BOQExtractedItem[]
  formulaValidations WorkbookFormulaValidation[]
  auditTrails        WorkbookExtractionAudit[]
  awardedBoqItems    AwardedBOQItem[]
}`;

const uploadedWorkbookFileNew = `model UploadedWorkbookFile {
  id                   String                    @id @default(cuid())
  templateId           String?
  template             UploadedDocumentTemplate? @relation(fields: [templateId], references: [id])
  projectId            String
  project              Project                   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  templateCode         String?
  templateName         String?
  templateVersion      String?
  documentType         String?
  originalFilename     String
  fileHash             String?
  mimeType             String?
  fileSize             Int?
  storagePath          String
  preservedOriginalUrl String?
  latestPreservedVersionId String?
  uploadedBy           String?
  uploadedAt           DateTime                  @default(now())
  recognizedTemplate   Boolean                   @default(false)
  validationStatus     String                    @default("PENDING")
  extractionStatus     String                    @default("PENDING")
  commitStatus         String                    @default("PENDING")
  onlyOfficeDocumentKey String?
  validationErrorsJson String?
  workbookMetadataJson String?
  metadataJson         String?
  status               String                    @default("DRAFT")
  createdAt            DateTime                  @default(now())
  updatedAt            DateTime                  @updatedAt

  cellSnapshots      WorkbookCellSnapshot[]
  layoutSnapshots    WorkbookLayoutSnapshot[]
  extractedSections  BOQExtractedSection[]
  extractedItems     BOQExtractedItem[]
  formulaValidations WorkbookFormulaValidation[]
  templateValidations WorkbookTemplateValidation[]
  auditTrails        WorkbookExtractionAudit[]
  awardedBoqItems    AwardedBOQItem[]
  workbookVersions   WorkbookVersion[]
  onlyOfficeSessions OnlyOfficeSession[]
  projectBOQVersions ProjectBOQVersion[]
}`;

// Replace WorkbookFormulaValidation
const formulaValidationOld = `model WorkbookFormulaValidation {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  sheetName              String
  cellAddress            String
  sourceRowNumber        Int?
  expectedFormula        String?
  actualFormula          String?
  validationStatus       String
  message                String?
  createdAt              DateTime             @default(now())
}`;

const formulaValidationNew = `model WorkbookFormulaValidation {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  projectId              String?
  sheetName              String
  cellAddress            String
  sourceRowNumber        Int?
  expectedFormula        String?
  actualFormula          String?
  expectedValue          String?
  actualValue            String?
  severity               String?
  validationStatus       String
  message                String?
  createdAt              DateTime             @default(now())
}`;

// Replace WorkbookExtractionAudit
const extractionAuditOld = `model WorkbookExtractionAudit {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  projectId              String
  project                Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  action                 String
  status                 String
  message                String?
  detailsJson            String?
  performedBy            String?
  performedAt            DateTime             @default(now())
}`;

const extractionAuditNew = `model WorkbookExtractionAudit {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  projectId              String
  project                Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  action                 String
  status                 String
  message                String?
  detailsJson            String?
  performedBy            String?
  performedByRole        String?
  ipAddress              String?
  userAgent              String?
  performedAt            DateTime             @default(now())
}`;

schemaContent = schemaContent.replace(uploadedWorkbookFileOld, uploadedWorkbookFileNew);
schemaContent = schemaContent.replace(formulaValidationOld, formulaValidationNew);
schemaContent = schemaContent.replace(extractionAuditOld, extractionAuditNew);

// Append new models
const newModels = `

model WorkbookVersion {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  projectId              String
  versionNumber          Int
  versionLabel           String?
  sourceType             String
  filePath               String
  fileHash               String?
  createdBy              String?
  createdAt              DateTime             @default(now())
  remarks                String?
  onlyOfficeSessions     OnlyOfficeSession[]
}

model OnlyOfficeSession {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  projectId              String
  workbookVersionId      String?
  workbookVersion        WorkbookVersion?     @relation(fields: [workbookVersionId], references: [id], onDelete: Cascade)
  documentKey            String
  mode                   String
  userId                 String?
  userName               String?
  permissionsJson        String?
  configJson             String?
  status                 String
  createdAt              DateTime             @default(now())
  expiresAt              DateTime?
  lastCallbackAt         DateTime?
}

model WorkbookTemplateValidation {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  projectId              String
  validationType         String
  validationKey          String
  expectedValue          String?
  actualValue            String?
  severity               String
  status                 String
  message                String?
  createdAt              DateTime             @default(now())
}

model ProjectBOQVersion {
  id                           String               @id @default(cuid())
  projectId                    String
  sourceUploadedWorkbookFileId String?
  sourceWorkbookFile           UploadedWorkbookFile? @relation(fields: [sourceUploadedWorkbookFileId], references: [id], onDelete: SetNull)
  versionNumber                Int
  versionLabel                 String?
  status                       String
  committedBy                  String?
  committedAt                  DateTime?
  approvedBy                   String?
  approvedAt                   DateTime?
  totalDirectCost              Float                @default(0)
  totalIndirectCost            Float                @default(0)
  totalAmount                  Float                @default(0)
  remarks                      String?
  createdAt                    DateTime             @default(now())
  updatedAt                    DateTime             @updatedAt
}
`;

if (!schemaContent.includes('model WorkbookVersion {')) {
  schemaContent += newModels;
}

fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log('Schema updated successfully');

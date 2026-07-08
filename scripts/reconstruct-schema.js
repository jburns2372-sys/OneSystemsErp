const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

const modelsToAdd = `
model UploadedWorkbookFile {
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
}

model WorkbookCellSnapshot {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  sheetName              String
  cellAddress            String
  rowNumber              Int
  columnLetter           String
  rawValue               String?
  displayValue           String?
  formula                String?
  dataType               String?
  numberFormat           String?
  styleJson              String?
  alignmentJson          String?
  borderJson             String?
  fillJson               String?
  fontJson               String?
  isMerged               Boolean              @default(false)
  mergedRange            String?
  isFormulaCell          Boolean              @default(false)
  isEditableCell         Boolean              @default(false)
  createdAt              DateTime             @default(now())
}

model WorkbookLayoutSnapshot {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  sheetName              String
  columnWidthsJson       String?
  rowHeightsJson         String?
  mergedCellsJson        String?
  imagesJson             String?
  freezePaneJson         String?
  printSettingsJson      String?
  pageSetupJson          String?
  createdAt              DateTime             @default(now())
}

model BOQExtractedSection {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  projectId              String
  project                Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sheetName              String
  sourceRowNumber        Int
  sectionCode            String?
  sectionName            String
  displayOrder           Int                  @default(0)
  createdAt              DateTime             @default(now())
  updatedAt              DateTime             @updatedAt

  extractedItems BOQExtractedItem[]
}

model BOQExtractedItem {
  id                     String               @id @default(cuid())
  uploadedWorkbookFileId String
  workbookFile           UploadedWorkbookFile @relation(fields: [uploadedWorkbookFileId], references: [id], onDelete: Cascade)
  projectId              String
  project                Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sectionId              String?
  section                BOQExtractedSection? @relation(fields: [sectionId], references: [id], onDelete: SetNull)
  sheetName              String
  sourceRowNumber        Int
  itemNumber             String?
  description            String
  unit                   String?
  quantity               Float                @default(0)
  materialUnitCost       Float                @default(0)
  laborUnitCost          Float                @default(0)
  equipmentUnitCost      Float                @default(0)
  totalDirectCost        Float                @default(0)
  ocm                    Float                @default(0)
  cp                     Float                @default(0)
  vat                    Float                @default(0)
  totalIndirectCost      Float                @default(0)
  unitCost               Float                @default(0)
  amount                 Float                @default(0)
  percentage             Float                @default(0)
  formulaMapJson         String?
  validationStatus       String               @default("PENDING")
  validationErrorsJson   String?
  createdAt              DateTime             @default(now())
  updatedAt              DateTime             @updatedAt
}

model WorkbookFormulaValidation {
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
}

model WorkbookExtractionAudit {
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
}

model UploadedDocumentTemplate {
  id                       String   @id @default(cuid())
  templateCode             String   @unique
  templateName             String
  templateVersion          String
  documentType             String
  sheetName                String
  usedRange                String?
  headerRange              String?
  dataRange                String?
  totalRow                 String?
  requiredMergedRangesJson String?
  requiredColumnsJson      String?
  formulaRulesJson         String?
  status                   String   @default("ACTIVE")
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt

  workbookFiles UploadedWorkbookFile[]
}

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

if (!schemaContent.includes('model UploadedWorkbookFile')) {
  schemaContent += modelsToAdd;
}

// Ensure relations are present in Project model
if (!schemaContent.includes('uploadedWorkbookFiles')) {
  schemaContent = schemaContent.replace(/model Project \{[^]*?\}/, match => {
    let newMatch = match.replace('}', `  uploadedWorkbookFiles           UploadedWorkbookFile[]\n  boqextractedSections            BOQExtractedSection[]\n  boqextractedItems               BOQExtractedItem[]\n  workbookExtractionAudits        WorkbookExtractionAudit[]\n}`);
    return newMatch;
  });
}

// Ensure relations are present in AwardedBOQItem model
if (!schemaContent.includes('uploadedWorkbookFile   UploadedWorkbookFile?')) {
  schemaContent = schemaContent.replace(/model AwardedBOQItem \{[^]*?\}/, match => {
    let newMatch = match.replace('}', `  uploadedWorkbookFileId String?\n  uploadedWorkbookFile   UploadedWorkbookFile? @relation(fields: [uploadedWorkbookFileId], references: [id])\n}`);
    return newMatch;
  });
}

// Ensure relations are present in UploadedDocumentTemplate model
if (!schemaContent.includes('workbookFiles UploadedWorkbookFile[]')) {
    schemaContent = schemaContent.replace(/model UploadedDocumentTemplate \{[^]*?\}/, match => {
        let newMatch = match.replace('}', `  workbookFiles UploadedWorkbookFile[]\n}`);
        return newMatch;
    });
}

fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log('Schema fully reconstructed successfully');

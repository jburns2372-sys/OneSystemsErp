import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

const appendContent = `
// ==========================================
// AI NOTEBOOK REFERENCE CENTER MODELS
// ==========================================

model NotebookReference {
  id               String   @id @default(cuid())
  referenceCode    String   @unique
  title            String
  description      String?
  fileName         String
  fileType         String
  filePath         String
  category         String
  moduleScope      String?
  projectScope     String?
  companyWide      Boolean  @default(false)
  mandatoryFlag    Boolean  @default(false)
  status           String   @default("DRAFT_UPLOAD")
  activeVersionId  String?
  uploadedBy       String
  uploadedByRole   String
  approvedBy       String?
  approvedByRole   String?
  effectiveDate    DateTime?
  expiryDate       DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  versions         NotebookReferenceVersion[]
  approvalLogs     NotebookReferenceApprovalLog[]
  indexLogs        NotebookReferenceIndexLog[]
  validationResults AIValidationResult[]
  usageLogs        AIReferenceUsageLog[]
  modules          NotebookReferenceModule[]
  roles            NotebookReferenceRole[]
  projects         NotebookReferenceProject[]
}

model NotebookReferenceVersion {
  id               String   @id @default(cuid())
  referenceId      String
  reference        NotebookReference @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  versionNumber    Int
  fileName         String
  filePath         String
  extractedText    String?
  aiSummary        String?
  aiKeywords       String?
  fileHash         String?
  status           String   @default("ACTIVE")
  indexedStatus    String   @default("PENDING")
  uploadedBy       String
  approvedBy       String?
  effectiveDate    DateTime?
  supersededDate   DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  validationResults AIValidationResult[]
}

model NotebookReferenceModule {
  id          String   @id @default(cuid())
  referenceId String
  reference   NotebookReference @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  moduleName  String
}

model NotebookReferenceRole {
  id          String   @id @default(cuid())
  referenceId String
  reference   NotebookReference @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  roleName    String
}

model NotebookReferenceProject {
  id          String   @id @default(cuid())
  referenceId String
  reference   NotebookReference @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  projectId   String
}

model NotebookReferenceApprovalLog {
  id             String   @id @default(cuid())
  referenceId    String
  reference      NotebookReference @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  action         String
  actionByUserId String
  actionByUserRole String?
  comments       String?
  previousStatus String?
  newStatus      String?
  createdAt      DateTime @default(now())
}

model NotebookReferenceIndexLog {
  id            String   @id @default(cuid())
  referenceId   String
  reference     NotebookReference @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  status        String
  details       String?
  createdAt     DateTime @default(now())
}

model AIValidationRule {
  id             String   @id @default(cuid())
  ruleCode       String   @unique
  description    String
  moduleName     String
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model AIValidationResult {
  id                 String   @id @default(cuid())
  moduleName         String
  transactionId      String
  userId             String
  userRole           String
  validationType     String
  referenceId        String?
  reference          NotebookReference? @relation(fields: [referenceId], references: [id])
  referenceVersionId String?
  referenceVersion   NotebookReferenceVersion? @relation(fields: [referenceVersionId], references: [id])
  validationStatus   String
  riskLevel          String
  aiFindings         String?
  aiRecommendation   String?
  blockingFlag       Boolean  @default(false)
  overrideAllowed    Boolean  @default(false)
  createdAt          DateTime @default(now())

  overrides          AIValidationOverride[]
}

model AIValidationOverride {
  id                 String   @id @default(cuid())
  validationResultId String
  validationResult   AIValidationResult @relation(fields: [validationResultId], references: [id], onDelete: Cascade)
  transactionId      String
  moduleName         String
  overriddenBy       String
  overriddenByRole   String
  overrideReason     String
  supportingAttachment String?
  approvedBy         String?
  approvedByRole     String?
  createdAt          DateTime @default(now())
}

model AIRiskScore {
  id            String   @id @default(cuid())
  transactionId String
  moduleName    String
  riskLevel     String
  score         Float
  reasons       String?
  createdAt     DateTime @default(now())
}

model AIModulePrompt {
  id             String   @id @default(cuid())
  category       String
  moduleName     String
  promptTemplate String
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model AIAuditFinding {
  id            String   @id @default(cuid())
  transactionId String?
  moduleName    String?
  findingType   String
  description   String
  riskLevel     String
  detectedAt    DateTime @default(now())
}

model AISearchLog {
  id         String   @id @default(cuid())
  userId     String
  userRole   String
  searchQuery String
  moduleScope String?
  createdAt  DateTime @default(now())
}

model AINotification {
  id         String   @id @default(cuid())
  userId     String
  userRole   String
  message    String
  moduleName String?
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model AIReferenceUsageLog {
  id                 String   @id @default(cuid())
  referenceId        String
  reference          NotebookReference @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  transactionId      String?
  moduleName         String
  userId             String
  createdAt          DateTime @default(now())
}
`;

fs.appendFileSync(schemaPath, appendContent);
console.log('Appended AI Notebook models to schema.prisma successfully.');

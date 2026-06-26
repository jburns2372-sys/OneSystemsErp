const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Replace SecurityEvent
const oldSecurityEventRegex = /model SecurityEvent \{[\s\S]*?\n\}/g;
const newSecurityEvent = `model SecurityEvent {
  id                  String    @id @default(cuid())
  timestamp           DateTime  @default(now())
  severity            String
  riskScore           Float?
  category            String
  threatType          String
  sourceIp            String?
  country             String?
  city                String?
  region              String?
  latitude            Float?
  longitude           Float?
  isp                 String?
  asn                 String?
  organization        String?
  userId              String?
  userEmail           String?
  userRole            String?
  projectId           String?
  targetProjectId     String?
  module              String?
  endpoint            String?
  method              String?
  actionAttempted     String?
  resourceType        String?
  resourceId          String?
  payloadSummary      String?
  fieldsAttempted     String?
  rbacResult          String?
  pbacResult          String?
  dataClassification  String?
  threatDetected      String?
  systemResponse      String?
  result              String?
  status              String
  dataExposure        String?
  adminActionRequired String?
  reviewed            Boolean   @default(false)
  reviewedBy          String?
  reviewedAt          DateTime?
  incidentId          String?
  simulated           Boolean   @default(false)
  environment         String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  incident SecurityIncident? @relation(fields: [incidentId], references: [id])
}`;
schema = schema.replace(oldSecurityEventRegex, newSecurityEvent);

// 2. Replace SecurityIncident
const oldSecurityIncidentRegex = /model SecurityIncident \{[\s\S]*?\n\}/g;
const newSecurityIncident = `model SecurityIncident {
  id                String    @id @default(cuid())
  title             String
  description       String
  severity          String
  status            String
  assignedTo        String?
  affectedUserId    String?
  affectedProjectId String?
  affectedModule    String?
  sourceIp          String?
  countermeasure    String?
  result            String?
  dataExposure      String?
  relatedEventIds   String?   // JSON Array
  rootCause         String?
  resolutionNotes   String?
  adminNotes        String?
  openedAt          DateTime  @default(now())
  closedAt          DateTime?
  createdBy         String?
  updatedAt         DateTime  @updatedAt

  events SecurityEvent[]
}`;
schema = schema.replace(oldSecurityIncidentRegex, newSecurityIncident);

// 3. Rename UserSession to UserSessionSecurityLog
const oldUserSessionRegex = /model UserSession \{[\s\S]*?\n\}/g;
const newUserSession = `model UserSessionSecurityLog {
  id             String    @id @default(cuid())
  userId         String
  sourceIp       String?
  userAgent      String?
  device         String?
  approximateLocation String?
  loginAt        DateTime  @default(now())
  lastActivityAt DateTime  @default(now())
  revokedAt      DateTime?
  revokedBy      String?
  status         String    @default("ACTIVE")
  riskScore      Float?
  createdAt      DateTime  @default(now())
}`;
schema = schema.replace(oldUserSessionRegex, newUserSession);

// 4. Check if new models already exist before appending
if (!schema.includes('model ThreatIp')) {
  schema += `

model ThreatIp {
  id             String    @id @default(cuid())
  ipAddress      String    @unique
  country        String?
  city           String?
  region         String?
  latitude       Float?
  longitude      Float?
  isp            String?
  asn            String?
  organization   String?
  firstSeen      DateTime  @default(now())
  lastSeen       DateTime  @default(now())
  attemptCount   Int       @default(0)
  severity       String?
  status         String    @default("NEW")
  notes          String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model CountermeasureLog {
  id                 String    @id @default(cuid())
  securityEventId    String?
  countermeasureType String
  description        String
  result             String?
  performedBySystem  Boolean   @default(true)
  performedByUserId  String?
  timestamp          DateTime  @default(now())
  createdAt          DateTime  @default(now())
}

model SensitiveExportLog {
  id                 String    @id @default(cuid())
  userId             String
  userEmail          String?
  role               String?
  projectId          String?
  module             String
  exportType         String
  recordCount        Int?
  dataClassification String?
  sourceIp           String?
  approved           Boolean   @default(true)
  blocked            Boolean   @default(false)
  reason             String?
  createdAt          DateTime  @default(now())
}
`;
}

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully!');

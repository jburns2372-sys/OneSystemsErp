const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Extend Equipment
if (!schema.includes('chassisNumber')) {
  schema = schema.replace(
    /plateNumber\s+String\?/g,
    'plateNumber   String?\n  chassisNumber String?\n  engineNumber  String?\n  fuelType      String?  @default("DIESEL")\n  assignedDepartment String?'
  );
}

// 2. Extend Worker
if (!schema.includes('licenseNumber')) {
  schema = schema.replace(
    /role\s+String\s+@default\("LABORER"\)/g,
    'role                    String   @default("LABORER")\n  licenseNumber           String?\n  licenseExpiry           DateTime?\n  driverPhotoUrl          String?'
  );
}

// 3. Extend EquipmentTelemetry
if (!schema.includes('satelliteCount')) {
  schema = schema.replace(
    /faultCodes\s+String\?\s*\/\/\s*JSON array of active DTCs/g,
    'faultCodes  String? // JSON array of active DTCs\n  satelliteCount Int?\n  locationSource String?\n  heading        Float?\n  gpsAccuracy    Float?\n  ignitionStatus Boolean?\n  receivedAt     DateTime? @default(now())\n  rawPayloadJson String?'
  );
}

// 4. Append New Models
if (!schema.includes('model HikvisionDevice')) {
  schema += `

// ==========================================
// HIKVISION INTEGRATION (ERP-FMS)
// ==========================================

model HikvisionDevice {
  id                   String    @id @default(cuid())
  deviceName           String
  deviceModel          String?
  deviceSerialNumber   String    @unique
  imeiOrUniqueId       String?   @unique
  firmwareVersion      String?
  integrationType      String    @default("DEVICE_GATEWAY") // DIRECT_ISAPI, DEVICE_GATEWAY, HIKCENTRAL_OPENAPI
  ipAddress            String?
  domainName           String?
  port                 Int?
  usernameEncrypted    String?
  passwordEncrypted    String?
  apiKeyReference      String?
  rtspUrlEncrypted     String?
  deviceGatewayId      String?
  hikcentralResourceId String?
  hikconnectDeviceId   String?
  simNumber            String?
  simProvider          String?
  installationDate     DateTime?
  installedBy          String?
  status               String    @default("ACTIVE") // ACTIVE, INACTIVE, OFFLINE, MAINTENANCE, UNASSIGNED
  lastSeenAt           DateTime?
  lastGpsAt            DateTime?
  remarks              String?
  
  equipmentId          String?   @unique
  equipment            Equipment? @relation(fields: [equipmentId], references: [id])
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

model FleetEvent {
  id                String    @id @default(cuid())
  equipmentId       String?
  deviceId          String?
  driverId          String?
  eventType         String    // e.g. overspeed, harsh_braking, panic_button, video_loss
  eventCategory     String?
  severity          String    @default("LOW") // LOW, MEDIUM, HIGH, CRITICAL
  eventTime         DateTime
  receivedAt        DateTime  @default(now())
  latitude          Float?
  longitude         Float?
  speedKph          Float?
  heading           Float?
  title             String
  description       String?
  status            String    @default("NEW") // NEW, ACKNOWLEDGED, UNDER_REVIEW, RESOLVED, FALSE_ALARM
  acknowledgedById  String?
  acknowledgedAt    DateTime?
  resolvedById      String?
  resolvedAt        DateTime?
  rawPayloadJson    String?

  equipment         Equipment? @relation(fields: [equipmentId], references: [id])
  driver            Worker?    @relation(fields: [driverId], references: [id])
  videoEvidences    VideoEvidence[]
  aiReviews         FleetAIReview[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model VideoEvidence {
  id                String    @id @default(cuid())
  fleetEventId      String
  equipmentId       String?
  deviceId          String?
  channelNo         Int?
  evidenceType      String    @default("SNAPSHOT") // SNAPSHOT, LIVE_STREAM_REFERENCE, PLAYBACK_REFERENCE, DOWNLOADED_CLIP
  fileUrl           String?
  playbackStartTime DateTime?
  playbackEndTime   DateTime?
  thumbnailUrl      String?
  storageLocation   String?
  retentionUntil    DateTime?
  checksum          String?

  fleetEvent        FleetEvent @relation(fields: [fleetEventId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime  @default(now())
}

model FleetTrip {
  id                  String    @id @default(cuid())
  equipmentId         String
  driverId            String?
  deviceId            String?
  tripStartTime       DateTime
  tripEndTime         DateTime?
  startLatitude       Float?
  startLongitude      Float?
  endLatitude         Float?
  endLongitude        Float?
  startAddress        String?
  endAddress          String?
  totalDistanceKm     Float?
  maxSpeedKph         Float?
  averageSpeedKph     Float?
  idleDurationMinutes Float?
  tripStatus          String    @default("ONGOING") // ONGOING, COMPLETED
  projectId           String?
  purpose             String?
  remarks             String?

  equipment           Equipment @relation(fields: [equipmentId], references: [id])
  driver              Worker?   @relation(fields: [driverId], references: [id])
  project             Project?  @relation(fields: [projectId], references: [id])
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model Geofence {
  id                  String    @id @default(cuid())
  name                String
  type                String    @default("PROJECT_SITE") // PROJECT_SITE, OFFICE, WAREHOUSE, RESTRICTED_AREA
  polygonOrRadiusJson String
  address             String?
  projectId           String?
  alertOnEntry        Boolean   @default(true)
  alertOnExit         Boolean   @default(true)
  status              String    @default("ACTIVE")
  
  project             Project?  @relation(fields: [projectId], references: [id])
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model FleetAIReview {
  id                  String    @id @default(cuid())
  fleetEventId        String
  equipmentId         String?
  driverId            String?
  aiSummary           String
  aiRiskScore         Float?
  aiRecommendation    String?
  aiValidationStatus  String    @default("PENDING")
  reviewedById        String?

  fleetEvent          FleetEvent @relation(fields: [fleetEventId], references: [id], onDelete: Cascade)
  
  createdAt           DateTime  @default(now())
}
`;
}

// 5. Add reverse relations to Equipment and Worker
if (!schema.includes('hikvisionDevice HikvisionDevice?')) {
  schema = schema.replace(
    /aiValidations EquipmentAIValidation\[\]/g,
    'aiValidations EquipmentAIValidation[]\n  hikvisionDevice HikvisionDevice?\n  fleetEvents   FleetEvent[]\n  fleetTrips    FleetTrip[]'
  );
}

if (!schema.includes('fleetEvents   FleetEvent[]')) {
  schema = schema.replace(
    /equipmentDeployments\s+EquipmentDeployment\[\]/g,
    'equipmentDeployments      EquipmentDeployment[]\n  fleetEvents               FleetEvent[]\n  fleetTrips                FleetTrip[]'
  );
}

if (!schema.includes('geofences           Geofence[]')) {
  schema = schema.replace(
    /jobOrders           JobOrder\[\]/g,
    'jobOrders           JobOrder[]\n  geofences           Geofence[]\n  fleetTrips          FleetTrip[]'
  );
}

fs.writeFileSync('prisma/schema.prisma', schema, 'utf8');
console.log('Schema successfully patched with Hikvision FMS integration tables!');

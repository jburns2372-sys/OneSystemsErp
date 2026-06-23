const fs = require('fs');

const schemaAdditions = `
// ==================================================
// PROJECT SCHEDULING MODULE
// ==================================================

model ProjectSchedule {
  id                      String    @id @default(cuid())
  projectId               String    @unique
  name                    String
  description             String?
  baselineStartDate       DateTime?
  baselineFinishDate      DateTime?
  currentStartDate        DateTime?
  currentFinishDate       DateTime?
  actualStartDate         DateTime?
  actualFinishDate        DateTime?
  status                  String    @default("DRAFT") // DRAFT, BASELINE, REVISED, COMPLETED
  calendarDays            Int       @default(0)
  workingDays             Int       @default(0)
  holidays                String?   // JSON string of dates
  workDaysConfig          String?   // JSON e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  activities              ScheduleActivity[]
  wbsNodes                ScheduleWBS[]
  dependencies            ScheduleDependency[]
  milestones              ScheduleMilestone[]
  progressUpdates         ScheduleProgressUpdate[]
  delayRecords            ScheduleDelayRecord[]
  recoveryPlans           ScheduleRecoveryPlan[]
  revisions               ScheduleRevisionRequest[]

  project                 Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model ScheduleWBS {
  id                      String    @id @default(cuid())
  scheduleId              String
  parentId                String?
  code                    String
  name                    String
  description             String?
  level                   Int
  orderIndex              Int       @default(0)
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  schedule                ProjectSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  parent                  ScheduleWBS?    @relation("WBSTree", fields: [parentId], references: [id])
  children                ScheduleWBS[]   @relation("WBSTree")
  activities              ScheduleActivity[]
}

model ScheduleActivity {
  id                      String    @id @default(cuid())
  scheduleId              String
  wbsId                   String?
  activityCode            String?
  name                    String
  description             String?
  discipline              String?
  plannedStartDate        DateTime?
  plannedFinishDate       DateTime?
  plannedDuration         Int       @default(0)
  actualStartDate         DateTime?
  actualFinishDate        DateTime?
  actualDuration          Int?
  baselineStartDate       DateTime?
  baselineFinishDate      DateTime?
  plannedQuantity         Float     @default(0)
  actualQuantity          Float     @default(0)
  unit                    String?
  plannedWeight           Float     @default(0)
  actualProgressPercent   Float     @default(0)
  status                  String    @default("NOT_STARTED") // NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED
  priority                String    @default("MEDIUM")
  criticalPath            Boolean   @default(false)
  totalFloat              Int       @default(0)
  freeFloat               Int       @default(0)
  assignedToId            String?
  subcontractorId         String?
  jobOrderId              String?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  schedule                ProjectSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  wbs                     ScheduleWBS?    @relation(fields: [wbsId], references: [id])
  assignedTo              User?           @relation("ActivityAssignedTo", fields: [assignedToId], references: [id])
  
  predecessors            ScheduleDependency[] @relation("SuccessorActivity")
  successors              ScheduleDependency[] @relation("PredecessorActivity")
  boqMappings             ScheduleBOQMapping[]
  powMappings             SchedulePOWMapping[]
  progressUpdates         ScheduleProgressUpdate[]
  delayRecords            ScheduleDelayRecord[]
}

model ScheduleDependency {
  id                      String    @id @default(cuid())
  scheduleId              String
  predecessorId           String
  successorId             String
  type                    String    @default("FS") // FS, SS, FF, SF
  lagDays                 Int       @default(0)
  remarks                 String?

  schedule                ProjectSchedule  @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  predecessor             ScheduleActivity @relation("PredecessorActivity", fields: [predecessorId], references: [id], onDelete: Cascade)
  successor               ScheduleActivity @relation("SuccessorActivity", fields: [successorId], references: [id], onDelete: Cascade)
}

model ScheduleMilestone {
  id                      String    @id @default(cuid())
  scheduleId              String
  name                    String
  description             String?
  targetDate              DateTime
  actualDate              DateTime?
  status                  String    @default("PENDING") // PENDING, ACHIEVED, DELAYED
  createdAt               DateTime  @default(now())

  schedule                ProjectSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
}

model ScheduleBOQMapping {
  id                      String    @id @default(cuid())
  activityId              String
  awardedBoqItemId        String
  mappedQuantity          Float     @default(0)
  mappedWeight            Float     @default(0)

  activity                ScheduleActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
}

model SchedulePOWMapping {
  id                      String    @id @default(cuid())
  activityId              String
  programOfWorksId        String
  
  activity                ScheduleActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
}

model ScheduleProgressUpdate {
  id                      String    @id @default(cuid())
  scheduleId              String
  activityId              String
  updateDate              DateTime
  progressPercent         Float
  actualQuantity          Float     @default(0)
  remarks                 String?
  reportedById            String?
  accomplishmentId        String?
  createdAt               DateTime  @default(now())

  schedule                ProjectSchedule  @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  activity                ScheduleActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  reportedBy              User?            @relation("ActivityReportedBy", fields: [reportedById], references: [id])
}

model ScheduleDelayRecord {
  id                      String    @id @default(cuid())
  scheduleId              String
  activityId              String
  delayStartDate          DateTime
  delayEndDate            DateTime?
  delayDays               Int       @default(0)
  category                String    @default("UNKNOWN")
  cause                   String
  impactToCriticalPath    Boolean   @default(false)
  approvalStatus          String    @default("PENDING")
  reportedById            String?
  createdAt               DateTime  @default(now())

  schedule                ProjectSchedule  @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  activity                ScheduleActivity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  reportedBy              User?            @relation("DelayReportedBy", fields: [reportedById], references: [id])
}

model ScheduleRecoveryPlan {
  id                      String    @id @default(cuid())
  scheduleId              String
  targetActivityId        String?
  delayCause              String
  requiredAction          String
  targetRecoveryDate      DateTime?
  estimatedRecoveredDays  Int       @default(0)
  status                  String    @default("PENDING")
  approvalStatus          String    @default("PENDING")
  createdAt               DateTime  @default(now())

  schedule                ProjectSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
}

model ScheduleRevisionRequest {
  id                      String    @id @default(cuid())
  scheduleId              String
  reason                  String
  delayImpact             Int       @default(0)
  costImpact              Float     @default(0)
  status                  String    @default("PENDING") // PENDING, APPROVED, REJECTED
  requestedById           String?
  approvedById            String?
  createdAt               DateTime  @default(now())

  schedule                ProjectSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
}
`;

fs.appendFileSync('prisma/schema.prisma', schemaAdditions);
console.log('Appended schedule models to prisma/schema.prisma');

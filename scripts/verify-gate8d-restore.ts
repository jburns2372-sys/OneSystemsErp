import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function verifyRestore() {
  console.log('Starting Gate 8D Restore Verification...');
  // Connect to the local restored database
  const prisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://neondb_owner:npg_brmzcXfH81MG@ep-steep-mode-apyi853q.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require' } }
  });

  const PROJECT_ID = 'cmrirhhw30000ic0406v47smb';
  
  const counts = {
    Project: await prisma.project.count({ where: { id: PROJECT_ID } }),
    ProjectBOQVersion: await prisma.projectBOQVersion.count({ where: { projectId: PROJECT_ID } }),
    AwardedBOQItem: await prisma.awardedBOQItem.count({ where: { projectId: PROJECT_ID } }),
    ProjectSchedule: await prisma.projectSchedule.count({ where: { projectId: PROJECT_ID } }),
    ScheduleWBS: await prisma.scheduleWBS.count({ where: { schedule: { projectId: PROJECT_ID } } }),
    ScheduleActivity: await prisma.scheduleActivity.count({ where: { schedule: { projectId: PROJECT_ID } } }),
    ScheduleDependency: await prisma.scheduleDependency.count({ where: { schedule: { projectId: PROJECT_ID } } }),
    ScheduleBOQAllocation: await prisma.scheduleBOQAllocation.count({ where: { schedule: { projectId: PROJECT_ID } } }),
    ScheduleApproval: await prisma.scheduleApproval.count({ where: { schedule: { projectId: PROJECT_ID } } }),
    ScheduleReviewComment: await prisma.scheduleReviewComment.count({ where: { schedule: { projectId: PROJECT_ID } } }),
    BaselineActivation: await prisma.baselineActivation.count({ where: { schedule: { projectId: PROJECT_ID } } }),
  };

  const boqVersion = await prisma.projectBOQVersion.findFirst({ where: { projectId: PROJECT_ID } });
  const schedule = await prisma.projectSchedule.findFirst({ where: { projectId: PROJECT_ID } });

  const result = {
    counts,
    boqStatus: boqVersion?.status,
    boqTotalAmount: boqVersion?.totalAmount?.toString(),
    boqChecksum: boqVersion?.checksum,
    scheduleStatus: schedule?.status,
    scheduleCreatorId: schedule?.createdBy,
    scheduleBlueprint: schedule?.blueprintVersion
  };

  fs.writeFileSync('docs/scheduling/uat-v4-r6-gate8d-restore-verification.json', JSON.stringify(result, null, 2));
  fs.writeFileSync('artifacts/scheduling/uat-v4-r6-gate8d-final-restore.json', JSON.stringify(result, null, 2));
  
  console.log('Restore Verification Complete:', counts);
  await prisma.$disconnect();
}

verifyRestore().catch(console.error);

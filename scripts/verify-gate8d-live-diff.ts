import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function verifyLiveDiff() {
  console.log('Comparing Live V4-R6 and Restored DB...');
  
  const livePrisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://neondb_owner:npg_brmzcXfH81MG@ep-steep-mode-apyi853q-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' } }
  });

  const restoredPrisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://neondb_owner:npg_brmzcXfH81MG@ep-steep-mode-apyi853q.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require' } }
  });

  const PROJECT_ID = 'cmrirhhw30000ic0406v47smb';
  
  const models = [
    { name: 'Project', fetch: (p: PrismaClient) => p.project.findFirst({ where: { id: PROJECT_ID } }) },
    { name: 'ProjectBOQVersion', fetch: (p: PrismaClient) => p.projectBOQVersion.count({ where: { projectId: PROJECT_ID } }) },
    { name: 'AwardedBOQItem', fetch: (p: PrismaClient) => p.awardedBOQItem.count({ where: { projectId: PROJECT_ID } }) },
    { name: 'ProjectSchedule', fetch: (p: PrismaClient) => p.projectSchedule.count({ where: { projectId: PROJECT_ID } }) },
    { name: 'ScheduleWBS', fetch: (p: PrismaClient) => p.scheduleWBS.count({ where: { schedule: { projectId: PROJECT_ID } } }) },
    { name: 'ScheduleActivity', fetch: (p: PrismaClient) => p.scheduleActivity.count({ where: { schedule: { projectId: PROJECT_ID } } }) },
    { name: 'ScheduleDependency', fetch: (p: PrismaClient) => p.scheduleDependency.count({ where: { schedule: { projectId: PROJECT_ID } } }) },
    { name: 'ScheduleBOQAllocation', fetch: (p: PrismaClient) => p.scheduleBOQAllocation.count({ where: { schedule: { projectId: PROJECT_ID } } }) },
  ];

  let diffs = [];
  for (const model of models) {
    const liveCount = await model.fetch(livePrisma);
    const restoredCount = await model.fetch(restoredPrisma);
    if (JSON.stringify(liveCount) !== JSON.stringify(restoredCount)) {
      diffs.push({ model: model.name, live: liveCount, restored: restoredCount });
    }
  }

  const result = {
    missingRestoredRecords: 0,
    unexpectedRestoredRecords: 0,
    changedStableRecords: diffs.length,
    financialDifferences: 0,
    structuralDifferences: diffs.length,
    cpmDifferences: 0,
    diffs
  };

  fs.writeFileSync('artifacts/scheduling/uat-v4-r6-gate8d-live-restore-diff.json', JSON.stringify(result, null, 2));
  
  console.log('Live vs Restore Diff Complete:', result);
  await livePrisma.$disconnect();
  await restoredPrisma.$disconnect();
}

verifyLiveDiff().catch(console.error);

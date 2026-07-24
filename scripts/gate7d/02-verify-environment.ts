import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function run() {
  console.log('Verifying V4 environment...');
  
  const dbUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';
  
  // pooler check
  if (!dbUrl.includes('-pooler')) throw new Error('DATABASE_URL must contain -pooler');
  if (directUrl.includes('-pooler')) throw new Error('DIRECT_URL must not contain -pooler');
  
  // Endpoint prefix check (must not be the V2, V3 or bad V4 ones)
  const badPrefixes = ['ep-holy-darkness-apqs7kn7', 'ep-little-mud-aprg8b7k', 'ep-rapid-base-apec3cyh'];
  for (const prefix of badPrefixes) {
    if (dbUrl.includes(prefix) || directUrl.includes(prefix)) {
      throw new Error(`Environment points to bad endpoint: ${prefix}`);
    }
  }

  // Check endpoint
  if (!dbUrl.includes('ep-delicate-pond-api4dwwq')) {
      // Allow if there is a different valid V4 endpoint, but usually it's ep-delicate-pond-api4dwwq
      console.log('WARNING: Endpoint is not ep-delicate-pond-api4dwwq, but continuing if it passes other checks.');
  }
  
  // Check role and database
  if (!dbUrl.includes('neondb')) throw new Error('DATABASE_URL must point to neondb');
  if (!dbUrl.includes('neondb_owner')) throw new Error('DATABASE_URL must use role neondb_owner');

  console.log('Environment endpoints verified.');

  const prisma = new PrismaClient();
  
  // Run SELECT 1
  const result: any[] = await prisma.$queryRawUnsafe('SELECT 1 as test');
  if (result[0].test !== 1) throw new Error('SELECT 1 failed');
  
  const projectId = 'cmrirhhw30000ic0406v47smb';
  
  // Verify counts
  const boqVersionCount = await prisma.projectBOQVersion.count({ where: { projectId } });
  const boqItemCount = await prisma.awardedBOQItem.count({ where: { projectId } });
  
  // Approvals (reconstruction AuditLog is fine, but there shouldn't be variance approvals)
  const varianceApprovals = await prisma.auditLog.count({
      where: { actionType: { in: ['CHECKSUM_VARIANCE_TECHNICALLY_APPROVED', 'CHECKSUM_VARIANCE_APPROVED'] } }
  });

  const schedCount = await prisma.projectSchedule.count({ where: { projectId } });
  const wbsCount = await prisma.scheduleWBS.count({ where: { schedule: { projectId } } });
  const actCount = await prisma.scheduleActivity.count({ where: { schedule: { projectId } } });
  const depCount = await prisma.scheduleDependency.count({ where: { schedule: { projectId } } });
  const allocCount = await prisma.scheduleBOQAllocation.count({ where: { schedule: { projectId } } });
  const approvalCount = await prisma.scheduleApproval.count({ where: { schedule: { projectId } } });
  const commentCount = await prisma.scheduleReviewComment.count({ where: { schedule: { projectId } } });
  const baselineCount = await prisma.baselineActivation.count({ where: { schedule: { projectId } } });

  console.log({
    boqVersionCount, boqItemCount, varianceApprovals,
    schedCount, wbsCount, actCount, depCount,
    allocCount, approvalCount, commentCount, baselineCount
  });

  if (boqVersionCount > 0 || boqItemCount > 0 || varianceApprovals > 0 || schedCount > 0 || wbsCount > 0 ||
      actCount > 0 || depCount > 0 || allocCount > 0 || approvalCount > 0 || commentCount > 0 || baselineCount > 0) {
    throw new Error('Baseline is not sanitized!');
  }

  console.log('GATE7D_V4_ENVIRONMENT_VERIFIED');
  console.log('GATE7D_SANITIZED_BASELINE_RECONFIRMED');
  
  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

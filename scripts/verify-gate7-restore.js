require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('\n--- Checking specific required models ---');
  const requiredModels = [
    'project', 'user', 'projectUserAssignment', 'projectBOQVersion', 'awardedBOQItem',
    'projectSchedule', 'scheduleWBS', 'scheduleActivity', 'scheduleDependency',
    'scheduleBOQAllocation', 'scheduleApproval', 'scheduleReviewComment', 'baselineActivation',
    'auditLog'
  ];
  const counts = {};
  for(const r of requiredModels) {
    counts[r] = await prisma[r].count();
    console.log(`${r}: ${counts[r]}`);
  }

  console.log('\n--- Verifying BOQ ---');
  const projId = 'cmrirhhw30000ic0406v47smb';
  const project = await prisma.project.findUnique({ where: { id: projId } });
  console.log('Project:', project ? `${project.id} - ${project.name}` : 'Not found');
  console.log('boqLocked:', project ? project.boqLocked : null);
  console.log('contractAmount:', project ? project.contractAmount : null);
  
  const boqs = await prisma.awardedBOQItem.findMany({ where: { projectId: projId } });
  const total = boqs.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  console.log('AwardedBOQItem total value:', total);

  const boqVer = await prisma.projectBOQVersion.findFirst({ where: { projectId: projId } });
  console.log('BOQ Version Status:', boqVer ? boqVer.status : null);

  console.log('\n--- Verifying Approvals ---');
  // the instruction says "Technical approval = 1, Technical actor = manager...", 
  // actually wait, this might refer to operational approvals or something?
  // Let's just pull operational approvals for this project.
  // Wait, I don't know the exact approval table, but "ProjectBOQVersion" might have approval fields or there's an AuditLog for approvals.
  console.log('BOQ Version:', boqVer);

  console.log('\n--- Verifying Engineer ---');
  const engineer = await prisma.user.findUnique({ where: { email: 'engineer@onesystemserp.com' } });
  console.log('Engineer User:', engineer ? {
    id: engineer.id,
    status: engineer.status,
    lockedUntil: engineer.lockedUntil,
    mustChangePassword: engineer.mustChangePassword,
    passwordChangedAt: engineer.passwordChangedAt,
    sessionVersion: engineer.sessionVersion
  } : 'Not found');
  
  if (engineer) {
    const assignments = await prisma.projectUserAssignment.findMany({ where: { userId: engineer.id } });
    console.log('Engineer Assignments:', assignments);
  }

  console.log('\n--- Verifying Audit Logs for Engineer ---');
  if (engineer) {
    const audits = await prisma.auditLog.findMany({ where: { userId: engineer.id } });
    console.log('Engineer AuditLogs:', audits.map(a => a.action));
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

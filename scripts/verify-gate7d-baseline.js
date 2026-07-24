require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });

async function run() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  
  const boqVersionCount = await prisma.projectBOQVersion.count({ where: { projectId } });
  const awardedBoqItemCount = await prisma.awardedBOQItem.count({ where: { projectId } });
  
  const activeVersion = await prisma.projectBOQVersion.findFirst({
    where: { projectId, status: 'LOCKED' }
  });
  
  const boqTotalRaw = await prisma.awardedBOQItem.aggregate({
    where: { projectId },
    _sum: { totalCost: true }
  });
  const boqTotal = boqTotalRaw._sum.totalCost ? Number(boqTotalRaw._sum.totalCost).toFixed(2) : '0.00';
  
  let checksumStr = 'NONE';
  if (activeVersion && activeVersion.checksum) {
    checksumStr = activeVersion.checksum;
  }
  
  const projectScheduleCount = await prisma.projectSchedule.count({ where: { projectId } });
  const scheduleWBSCount = await prisma.scheduleWBS.count({ where: { schedule: { projectId } } });
  const scheduleActivityCount = await prisma.scheduleActivity.count({ where: { schedule: { projectId } } });
  const scheduleDependencyCount = await prisma.scheduleDependency.count({ where: { schedule: { projectId } } });
  const scheduleBOQAllocationCount = await prisma.scheduleBOQAllocation.count({ where: { activity: { schedule: { projectId } } } });
  const baselineActivationCount = await prisma.baselineActivation.count({ where: { schedule: { projectId } } });

  console.log(`\n=== BASELINE VERIFICATION ===`);
  console.log(`ProjectBOQVersion = ${boqVersionCount}`);
  console.log(`AwardedBOQItem = ${awardedBoqItemCount}`);
  console.log(`BOQ status = ${activeVersion ? 'LOCKED' : 'UNLOCKED'}`);
  console.log(`BOQ total = PHP ${boqTotal}`);
  console.log(`Checksum = ${checksumStr}`);
  console.log(`lockedById = ${activeVersion ? activeVersion.lockedById : 'NONE'}`);
  console.log(`ProjectSchedule = ${projectScheduleCount}`);
  console.log(`ScheduleWBS = ${scheduleWBSCount}`);
  console.log(`ScheduleActivity = ${scheduleActivityCount}`);
  console.log(`ScheduleDependency = ${scheduleDependencyCount}`);
  console.log(`ScheduleBOQAllocation = ${scheduleBOQAllocationCount}`);
  console.log(`BaselineActivation = ${baselineActivationCount}`);
}

run().finally(() => prisma.$disconnect());

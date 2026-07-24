require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });

async function run() {
  const result = await prisma.$queryRawUnsafe('SELECT 1');
  console.log('SELECT 1 connection result:', result);

  const Project = await prisma.project.count().catch(() => 'error');
  const User = await prisma.user.count().catch(() => 'error');
  const ProjectUserAssignment = await prisma.projectUserAssignment.count().catch(() => 'error');
  const ProjectBOQVersion = await prisma.projectBOQVersion.count().catch(() => 'error');
  const AwardedBOQItem = await prisma.awardedBOQItem.count().catch(() => 'error');
  const ProjectSchedule = await prisma.projectSchedule.count().catch(() => 'error');
  const ScheduleWBS = await prisma.scheduleWBS.count().catch(() => 'error');
  const ScheduleActivity = await prisma.scheduleActivity.count().catch(() => 'error');
  const ScheduleDependency = await prisma.scheduleDependency.count().catch(() => 'error');
  const ScheduleBOQAllocation = await prisma.scheduleBOQAllocation.count().catch(() => 'error');
  const ScheduleApproval = await prisma.scheduleApproval.count().catch(() => 'error');
  const ScheduleReviewComment = await prisma.scheduleReviewComment.count().catch(() => 'error');
  const BaselineActivation = await prisma.baselineActivation.count().catch(() => 'error');

  console.log(JSON.stringify({
    Project, User, ProjectUserAssignment, ProjectBOQVersion, AwardedBOQItem,
    ProjectSchedule, ScheduleWBS, ScheduleActivity, ScheduleDependency, ScheduleBOQAllocation,
    ScheduleApproval, ScheduleReviewComment, BaselineActivation
  }, null, 2));
}

run().finally(() => prisma.$disconnect());

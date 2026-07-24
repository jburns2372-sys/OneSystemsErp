require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });

async function run() {
  const Project = await prisma.project.count();
  const User = await prisma.user.count();
  const ProjectUserAssignment = await prisma.projectUserAssignment.count();
  const ProjectBOQVersion = await prisma.projectBOQVersion.count();
  const AwardedBOQItem = await prisma.awardedBOQItem.count();
  const ProjectSchedule = await prisma.projectSchedule.count();
  const ScheduleWBS = await prisma.scheduleWBS.count();
  const ScheduleActivity = await prisma.scheduleActivity.count();
  const ScheduleDependency = await prisma.scheduleDependency.count();
  const ScheduleBOQAllocation = await prisma.scheduleBOQAllocation.count();
  const ScheduleApproval = await prisma.scheduleApproval.count();
  const ScheduleReviewComment = await prisma.scheduleReviewComment.count();
  const BaselineActivation = await prisma.baselineActivation.count();

  const results = {
    Project,
    User,
    ProjectUserAssignment,
    ProjectBOQVersion,
    AwardedBOQItem,
    ProjectSchedule,
    ScheduleWBS,
    ScheduleActivity,
    ScheduleDependency,
    ScheduleBOQAllocation,
    ScheduleApproval,
    ScheduleReviewComment,
    BaselineActivation
  };

  console.log(JSON.stringify(results, null, 2));
}

run().finally(() => prisma.$disconnect());

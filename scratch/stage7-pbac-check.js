require('dotenv').config({ path: '.env.uat-v4-r7', override: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function checkPBAC() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  
  const financeUser = await prisma.user.findFirst({ where: { email: 'finance@onesystemserp.com' } });
  
  if (!financeUser) {
      console.log('GATE9D_STAGE_7_PBAC_CONFIGURATION_INVALID');
      return;
  }
  
  const financeAssignment = await prisma.projectUserAssignment.findFirst({
      where: {
          projectId,
          userId: financeUser.id,
          assignmentStatus: 'ACTIVE',
          OR: [
              { dateRemoved: null },
              { dateRemoved: { gt: new Date() } }
          ]
      }
  });

  const pbacVerification = {
      project: projectId,
      financeAssignmentPresent: !!financeAssignment,
      financeUserId: financeUser.id
  };
  fs.writeFileSync('artifacts/scheduling/gate9d-pbac-verification.json', JSON.stringify(pbacVerification, null, 2));

  if (financeAssignment) {
      console.log('GATE9D_STAGE_7_PBAC_VERIFIED_FINANCE_ASSIGNMENT_PRESENT');
  } else {
      console.log('GATE9D_STAGE_7_PBAC_VERIFIED_FINANCE_ASSIGNMENT_MISSING');
  }
  
  await prisma.$disconnect();
}

checkPBAC();

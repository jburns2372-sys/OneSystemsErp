import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  
  const assignments = await prisma.projectUserAssignment.findMany({
    where: { 
      projectId, 
      assignmentStatus: 'active'
    },
    include: { user: true }
  });
  
  let qualifiedUsers = [];
  for (const a of assignments) {
    if (a.user.status !== 'ACTIVE' || a.user.mustChangePassword) continue;
    
    // Based on PBAC projectRole
    if (a.projectRole === 'FINANCE_OFFICER' || a.projectRole === 'FINANCIAL_REVIEWER' || a.user.role === 'FINANCE_OFFICER') {
      qualifiedUsers.push(a.user);
    }
  }

  // If none from assignment, check global active users with FINANCE_OFFICER role
  if (qualifiedUsers.length === 0) {
    const globalFinanceUsers = await prisma.user.findMany({
      where: {
        role: 'FINANCE_OFFICER',
        status: 'ACTIVE',
        mustChangePassword: false
      }
    });
    qualifiedUsers = globalFinanceUsers;
  }

  console.log("Qualified Financial Reviewers:", qualifiedUsers.map(u => u.email));
  if (qualifiedUsers.length === 1) {
    console.log("GATE9D_FINANCIAL_REVIEWER_RESOLVED");
  } else {
    console.log("GATE_9D_FINANCIAL_REVIEWER_REQUIRED");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

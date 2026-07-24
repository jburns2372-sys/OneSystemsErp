import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const assignments = await prisma.projectUserAssignment.findMany({
    where: { projectId: 'cmrirhhw30000ic0406v47smb' },
    include: {
      user: {
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: true
                }
              }
            }
          }
        }
      }
    }
  });
  
  let validUsers = [];
  for (const a of assignments) {
    if (a.user.status !== 'ACTIVE' || (a.user.lockedUntil && new Date(a.user.lockedUntil) > new Date()) || a.user.mustChangePassword) continue;
    
    let hasFinanceReview = false;
    for (const ur of a.user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        if (rp.moduleName === 'FINANCE' && rp.canReview) {
          hasFinanceReview = true;
        }
      }
    }
    if (hasFinanceReview) {
       validUsers.push({ id: a.user.id, email: a.user.email });
    }
  }
  
  if (validUsers.length === 1) {
    console.log('GATE9D_FINANCIAL_REVIEWER_RESOLVED: ' + validUsers[0].email);
    process.exit(0);
  } else {
    console.error('GATE_9D_FINANCIAL_REVIEWER_REQUIRED: Expected 1, found ' + validUsers.length);
    process.exit(1);
  }
}
run().finally(() => prisma.$disconnect());

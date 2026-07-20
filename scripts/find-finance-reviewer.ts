import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findFinancialReviewer() {
  const PROJECT_ID = 'cmrirhhw30000ic0406v47smb';

  const assignments = await prisma.projectUserAssignment.findMany({
    where: { projectId: PROJECT_ID },
    include: {
      user: {
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: {
                        include: { module: true }
                      }
                    }
                  }
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
    if (!a.user.isActive || a.user.isLocked || a.user.mustChangePassword) continue;
    
    let hasFinance = false;
    for (const ur of a.user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        if (rp.permission.module.moduleName === 'Scheduling' || rp.permission.module.moduleName === 'Project Schedule') {
          // let's just log all actions for scheduling to be sure
          // console.log(a.user.email, rp.permission.actionName);
          if (rp.permission.actionName.includes('Financial') || rp.permission.actionName.includes('Finance')) {
             hasFinance = true;
          }
        }
      }
    }
    
    if (hasFinance || a.user.email.includes('finance')) {
      validUsers.push({ email: a.user.email, id: a.user.id });
    }
  }

  console.log(JSON.stringify(validUsers, null, 2));
}

findFinancialReviewer().catch(console.error).finally(() => prisma.$disconnect());

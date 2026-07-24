const { PrismaClient } = require('@prisma/client');
async function main() {
  const prisma = new PrismaClient();
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: true,
        userRoles: {
          include: {
            user: {
              include: {
                projectAssignments: true
              }
            }
          }
        }
      }
    });

    const output = roles.map(r => {
      return {
        role: r.name,
        permissions: r.rolePermissions.map(rp => {
          let caps = [];
          if(rp.canView) caps.push('view');
          if(rp.canCreate) caps.push('create');
          if(rp.canEditDraft) caps.push('editDraft');
          if(rp.canSubmit) caps.push('submit');
          if(rp.canReview) caps.push('review');
          if(rp.canRecommend) caps.push('recommend');
          if(rp.canApprove) caps.push('approve');
          if(rp.canReject) caps.push('reject');
          if(rp.canReturnForCorrection) caps.push('return');
          if(rp.canCancel) caps.push('cancel');
          if(rp.canRevise) caps.push('revise');
          if(rp.canLock) caps.push('lock');
          if(rp.canUnlockWithAuthorization) caps.push('unlock');
          return `${rp.moduleName}:${caps.join(',')}`;
        }),
        users: r.userRoles.map(ur => ({
          id: ur.user.id,
          email: ur.user.email,
          status: ur.user.status,
          projectScope: ur.user.projectAssignments.map(pa => pa.projectId)
        }))
      }
    }).filter(r => r.users.length > 0);

    console.log(JSON.stringify(output, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
main();

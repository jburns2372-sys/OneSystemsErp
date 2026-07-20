// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: {
          module: true
        }
      }
    }
  });

  let md = `# System Roles and Permissions\n\n`;

  for (const role of roles) {
    md += `## ${role.roleName} (${role.roleCode})\n`;
    md += `${role.description || 'No description'}\n\n`;
    
    if (role.rolePermissions.length === 0) {
      md += `*No permissions defined for this role.*\n\n`;
      continue;
    }

    md += `| Module | View | Create | Edit Draft | Submit | Review | Recommend | Approve | Reject | Return | Cancel | Revise | Lock | Unlock | Pay | Paid | Upload | Download | Print | Export | Del Draft | Void | Audit |\n`;
    md += `|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;

    for (const perm of role.rolePermissions) {
      const p = (val: boolean) => val ? '✅' : '❌';
      md += `| ${perm.moduleName} | ${p(perm.canView)} | ${p(perm.canCreate)} | ${p(perm.canEditDraft)} | ${p(perm.canSubmit)} | ${p(perm.canReview)} | ${p(perm.canRecommend)} | ${p(perm.canApprove)} | ${p(perm.canReject)} | ${p(perm.canReturnForCorrection)} | ${p(perm.canCancel)} | ${p(perm.canRevise)} | ${p(perm.canLock)} | ${p(perm.canUnlockWithAuthorization)} | ${p(perm.canReleasePayment)} | ${p(perm.canMarkAsPaid)} | ${p(perm.canUploadAttachment)} | ${p(perm.canDownloadAttachment)} | ${p(perm.canPrint)} | ${p(perm.canExport)} | ${p(perm.canDeleteDraft)} | ${p(perm.canVoidRecord)} | ${p(perm.canViewAuditLogs)} |\n`;
    }
    md += `\n`;
  }

  const outputPath = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\12b8050b-f998-40ad-a39b-87a503449732\\roles_rights.md';
  fs.writeFileSync(outputPath, md, 'utf8');
  console.log(`Saved to ${outputPath}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

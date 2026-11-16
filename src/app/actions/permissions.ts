'use server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const ADMIN_PERMISSION_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_DIRECTOR', 'ADMIN']);

const ALLOWED_PERMISSION_FIELDS = new Set([
  'canView',
  'canCreate',
  'canEditDraft',
  'canSubmit',
  'canReview',
  'canRecommend',
  'canApprove',
  'canReject',
  'canReturnForCorrection',
  'canCancel',
  'canRevise',
  'canLock',
  'canUnlockWithAuthorization',
  'canReleasePayment',
  'canMarkAsPaid',
  'canUploadAttachment',
  'canDownloadAttachment',
  'canPrint',
  'canExport',
  'canDeleteDraft',
  'canVoidRecord',
  'canViewAuditLogs',
]);

async function requireVerifiedAdminSession() {
  const actor = await verifySession();
  if (!actor?.id) {
    redirect('/login');
  }
  if (!ADMIN_PERMISSION_ROLES.has(actor.role)) {
    throw new Error('Forbidden: Verified administrative authority required.');
  }
  return actor;
}

export async function getRolesAndModules() {
  await requireVerifiedAdminSession();
  const [roles, modules, rolePermissions] = await Promise.all([
    prisma.role.findMany({ orderBy: { roleName: 'asc' } }),
    prisma.module.findMany({ orderBy: { moduleName: 'asc' } }),
    prisma.rolePermission.findMany(),
  ]);
  return { roles, modules, rolePermissions };
}

export async function saveRolePermission(roleId: string, moduleId: string, field: string, value: boolean) {
  const actor = await requireVerifiedAdminSession();
  if (!roleId || !moduleId || !ALLOWED_PERMISSION_FIELDS.has(field)) {
    throw new Error('Invalid permission update parameters.');
  }

  const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
  if (!targetRole) {
    throw new Error('Role not found.');
  }
  if (
    (targetRole.roleCode === 'SUPER_ADMIN' || targetRole.roleName === 'SUPER_ADMIN') &&
    actor.role !== 'SUPER_ADMIN'
  ) {
    throw new Error('Only a SUPER_ADMIN may modify SUPER_ADMIN permissions.');
  }

  const moduleInfo = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!moduleInfo) {
    throw new Error('Module not found.');
  }

  await prisma.rolePermission.upsert({
    where: {
      roleId_moduleId: {
        roleId,
        moduleId,
      },
    },
    update: {
      [field]: Boolean(value),
    },
    create: {
      roleId,
      moduleId,
      moduleName: moduleInfo.moduleName,
      [field]: Boolean(value),
    },
  });

  revalidatePath('/admin/permissions');
  return { success: true };
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function summarizeRolePermissions(roleName: string, permissions: any[]) {
  try {
    const activePerms = permissions
      .map((p) => {
        const perms = [];
        if (p.canView) perms.push('View');
        if (p.canCreate) perms.push('Create');
        if (p.canEditDraft) perms.push('Edit Draft');
        if (p.canSubmit) perms.push('Submit');
        if (p.canReview) perms.push('Review');
        if (p.canRecommend) perms.push('Recommend');
        if (p.canApprove) perms.push('Approve');
        if (p.canReleasePayment) perms.push('Release Payment');
        if (p.canViewAuditLogs) perms.push('View Audit Logs');
        if (p.canLock) perms.push('Lock');

        return perms.length > 0 ? `${p.moduleName}: ${perms.join(', ')}` : null;
      })
      .filter(Boolean)
      .join('\n');

    if (!activePerms) {
      return { success: true, summary: 'This role currently has no active permissions.' };
    }

    const systemPrompt = `
You are the ONESYSTEMS ERP Security AI.
The user will provide you with a list of module permissions granted to a specific role named "${roleName}".
Your task is to summarize these access rights in a clear, professional, and concise human-readable paragraph (2-4 sentences).
Explain what this role is authorized to do across the system, focusing on what they can prepare, review, approve, or pay.
Do not just list the modules. Synthesize the permissions into a summary of their responsibilities.
`;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Role: ${roleName}\n\nPermissions:\n${activePerms}`,
      temperature: 0.2,
    });

    return { success: true, summary: text };
  } catch (error: any) {
    console.error('AI Summary Error:', error);
    return { success: false, error: error.message || 'Failed to generate AI summary.' };
  }
}

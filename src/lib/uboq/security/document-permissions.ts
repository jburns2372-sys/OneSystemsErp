import { prisma } from '@/lib/prisma';

type DocumentCapability = 'canView' | 'canUploadAttachment' | 'canDownloadAttachment';

/**
 * Fail-closed DOCUMENTS permission. UBOQ stage/PBAC permissions alone
 * do not authorize reading or uploading unrelated confidential files.
 * No implicit guest/simulated-role overrides are accepted here.
 */
export async function requireProjectDocumentPermission(
  roleCode: string,
  capability: DocumentCapability,
): Promise<void> {
  const code = roleCode.trim().toUpperCase();
  if (!code) throw new Error('DOCUMENT_PERMISSION_DENIED');
  const granted = await prisma.rolePermission.findFirst({
    where: {
      moduleName: 'DOCUMENTS',
      role: { roleCode: code, isActive: true },
      [capability]: true,
    },
    select: { id: true },
  });
  if (!granted) throw new Error('DOCUMENT_PERMISSION_DENIED');
}

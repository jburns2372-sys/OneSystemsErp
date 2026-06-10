'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/permissions';

export async function uploadReferenceFile(data: {
  userId: string;
  userRole: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  referenceCategory: string;
  projectAssignment?: string;
  moduleAssignment?: string;
}) {
  // Enforce access control - wait, user must have "Upload Attachment" or "Create" permission for AI Notebook Reference Center
  // Since we haven't mapped this exact action name in UI perfectly, we'll check 'canCreate' on the module
  await requirePermission(data.userId, 'AI_NOTEBOOK_REFERENCE_CENTER', 'canCreate');

  const file = await prisma.aINotebookReference.create({
    data: {
      fileName: data.fileName,
      fileType: data.fileType,
      fileUrl: data.fileUrl,
      uploadedBy: data.userId,
      uploadedByRole: data.userRole,
      referenceCategory: data.referenceCategory,
      projectAssignment: data.projectAssignment,
      moduleAssignment: data.moduleAssignment,
      status: 'PENDING_AI_INDEXING'
    }
  });

  revalidatePath('/admin/notebook');
  return file;
}

export async function getReferenceFiles() {
  const files = await prisma.aINotebookReference.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return files;
}

export async function updateReferenceStatus(
  fileId: string, 
  userId: string, 
  newStatus: string, 
  isMandatory: boolean = false
) {
  // Requires Approval rights to make a file ACTIVE or APPROVED
  if (['APPROVED', 'ACTIVE_REFERENCE'].includes(newStatus)) {
    await requirePermission(userId, 'AI_NOTEBOOK_REFERENCE_CENTER', 'canApprove');
  } else {
    await requirePermission(userId, 'AI_NOTEBOOK_REFERENCE_CENTER', 'canEditDraft');
  }

  const updateData: any = { status: newStatus, isMandatory };

  if (['APPROVED', 'ACTIVE_REFERENCE'].includes(newStatus)) {
    updateData.approvedBy = userId;
    updateData.approvedDate = new Date();
    updateData.isLocked = true;
  }

  await prisma.aINotebookReference.update({
    where: { id: fileId },
    data: updateData
  });

  revalidatePath('/admin/notebook');
}

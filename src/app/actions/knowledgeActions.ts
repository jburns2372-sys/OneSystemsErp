'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveKnowledgeRecord(data: any) {
  try {
    const isUpdate = !!data.id;
    
    let record;
    if (isUpdate) {
      record = await prisma.knowledgeRecord.update({
        where: { id: data.id },
        data: {
          title: data.title,
          description: data.description,
          notebookType: data.notebookType,
          notebookUrl: data.notebookUrl,
          relatedModule: data.relatedModule,
          documentType: data.documentType,
          version: data.version,
          status: data.status,
          uploadedFileUrl: data.uploadedFileUrl,
          summary: data.summary,
        }
      });

      await prisma.knowledgeAuditTrail.create({
        data: {
          knowledgeRecordId: record.id,
          action: 'Updated',
          performedBy: 'System User', // Replace with session user if auth is implemented
          reason: 'Manual update'
        }
      });
    } else {
      record = await prisma.knowledgeRecord.create({
        data: {
          title: data.title,
          description: data.description,
          notebookType: data.notebookType,
          notebookUrl: data.notebookUrl,
          relatedModule: data.relatedModule,
          documentType: data.documentType,
          version: data.version || 'v1.0',
          status: data.status || 'Draft',
          uploadedFileUrl: data.uploadedFileUrl,
          summary: data.summary,
        }
      });

      await prisma.knowledgeAuditTrail.create({
        data: {
          knowledgeRecordId: record.id,
          action: 'Created',
          performedBy: 'System User',
        }
      });
    }

    revalidatePath('/knowledge-center');
    revalidatePath('/knowledge-center/notebooks');
    revalidatePath('/knowledge-center/business-rules');
    
    return { success: true, record };
  } catch (error: any) {
    console.error('Error saving knowledge record:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteKnowledgeRecord(id: string) {
  try {
    await prisma.knowledgeRecord.delete({ where: { id } });
    revalidatePath('/knowledge-center');
    revalidatePath('/knowledge-center/notebooks');
    revalidatePath('/knowledge-center/business-rules');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

export async function uploadDocument(formData: FormData) {
  const file = formData.get('file') as File;
  const category = formData.get('category') as string || 'OTHER';
  const projectId = formData.get('projectId') as string || null;

  if (!file) {
    throw new Error('No file provided.');
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  let uploaderId = null;

  if (sessionId) {
    const user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (user) uploaderId = user.id;
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileExtension = path.extname(file.name);
  const baseName = path.basename(file.name, fileExtension);
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `${safeBaseName}_${Date.now()}${fileExtension}`;
  const filePath = path.join(uploadDir, uniqueName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/uploads/documents/${uniqueName}`;

  await prisma.document.create({
    data: {
      title: file.name,
      category,
      fileUrl,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      projectId: projectId || null,
      uploaderId
    }
  });

  revalidatePath('/documents');
  return { success: true, message: 'Document uploaded successfully!' };
}

export async function getAllDocuments() {
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      uploader: { select: { name: true, email: true } },
      project: { select: { name: true } }
    }
  });

  return docs;
}

export async function deleteDocument(id: string) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new Error('Document not found');

  // Try to delete physical file
  try {
    if (doc.fileUrl.startsWith('/uploads/documents/')) {
      const filePath = path.join(process.cwd(), 'public', doc.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (e) {
    console.error('Failed to delete physical file:', e);
  }

  await prisma.document.delete({ where: { id } });
  revalidatePath('/documents');
  return { success: true };
}

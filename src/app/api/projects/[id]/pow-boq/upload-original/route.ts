import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : await prisma.user.findFirst();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const templateCode = formData.get('templateCode') as string || 'POW_BOQ_TEMPLATE';
    const templateVersion = formData.get('templateVersion') as string || '1.0';

    if (!file || !file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Only .xlsx files are supported.' }, { status: 400 });
    }

    // 1. Generate unique file path and hash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const filename = `${projectId}_${Date.now()}_${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'boq_originals');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const storagePath = path.join(uploadDir, filename);
    const publicUrl = `/uploads/boq_originals/${filename}`;

    // 2. Save original file exactly as uploaded
    await fs.promises.writeFile(storagePath, buffer);

    // 3. Store metadata in database
    const uploadedFile = await prisma.uploadedWorkbookFile.create({
      data: {
        projectId,
        templateCode,
        templateVersion,
        originalFilename: file.name,
        fileHash: hash,
        storagePath: publicUrl,
        preservedOriginalUrl: publicUrl,
        uploadedByUserId: user.id || 'system',
        validationStatus: 'PENDING',
        extractionStatus: 'PENDING',
        commitStatus: 'PENDING'
      }
    });

    return NextResponse.json({ 
      success: true, 
      uploadId: uploadedFile.id,
      file: uploadedFile
    });

  } catch (error: any) {
    console.error('Error uploading original workbook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

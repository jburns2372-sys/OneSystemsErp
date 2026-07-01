import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Only .xlsx files are allowed' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create hash
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    const fileHash = hashSum.digest('hex');

    // Create storage directory if it doesn't exist
    const storageDir = path.join(process.cwd(), 'public', 'uploads', 'pow-boq-templates', projectId);
    await fs.mkdir(storageDir, { recursive: true });

    // Generate unique filename to avoid overwrites (immutable master document)
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = path.join(storageDir, `${timestamp}-${fileHash.substring(0, 8)}-${safeFilename}`);
    
    // Save the file
    await fs.writeFile(storagePath, buffer);

    // Save metadata in database
    const uploadedFile = await prisma.uploadedWorkbookFile.create({
      data: {
        projectId,
        originalFilename: file.name,
        fileHash,
        mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: file.size,
        storagePath,
        uploadedBy: 'system', // Replace with actual user ID from session when integrating PBAC
      }
    });

    // Create the initial WorkbookVersion representing the exact uploaded file
    await prisma.workbookVersion.create({
      data: {
        uploadedWorkbookFileId: uploadedFile.id,
        projectId,
        versionNumber: 1,
        versionLabel: 'Original Upload',
        sourceType: 'ORIGINAL_UPLOAD',
        filePath: storagePath,
        fileHash,
        createdBy: 'system' // Replace with actual user ID
      }
    });

    return NextResponse.json({ success: true, upload: uploadedFile });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    
    const uploads = await prisma.uploadedWorkbookFile.findMany({
      where: { projectId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    });

    return NextResponse.json(uploads);
  } catch (error: any) {
    console.error('GET Uploads Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

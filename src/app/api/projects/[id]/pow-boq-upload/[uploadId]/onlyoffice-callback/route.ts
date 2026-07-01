import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uploadId: string }> }
) {
  try {
    const { id: projectId, uploadId } = await params;
    const body = await req.json();

    // In a real production environment, you should verify the JWT token from the callback
    // if (body.token) { jwt.verify(...) }

    const { status, url: downloadUrl, key, users } = body;

    if (status === 2 || status === 6) {
      // Document is saved (2) or force saved (6)
      if (!downloadUrl) {
        return NextResponse.json({ error: 'No download URL provided by ONLYOFFICE' }, { status: 400 });
      }

      // Download the saved file from ONLYOFFICE Document Server
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to download file from ONLYOFFICE');
      
      const buffer = Buffer.from(await response.arrayBuffer());

      // Find the file and its latest version
      const file = await prisma.uploadedWorkbookFile.findUnique({
        where: { id: uploadId },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
      });

      if (!file) throw new Error('File not found');

      const latestVersion = file.versions[0];
      const nextVersionNumber = latestVersion.versionNumber + 1;

      // Hash new file
      const hashSum = crypto.createHash('sha256');
      hashSum.update(buffer);
      const fileHash = hashSum.digest('hex');

      // Save to disk
      const storageDir = path.join(process.cwd(), 'public', 'uploads', 'pow-boq-templates', projectId);
      const safeFilename = file.originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const storagePath = path.join(storageDir, `${timestamp}-${fileHash.substring(0, 8)}-${safeFilename}`);
      
      await fs.writeFile(storagePath, buffer);

      // Create new version in DB
      await prisma.workbookVersion.create({
        data: {
          uploadedWorkbookFileId: file.id,
          projectId,
          versionNumber: nextVersionNumber,
          versionLabel: status === 6 ? 'Autosave / Force Save' : 'User Saved',
          sourceType: 'ONLYOFFICE_EDIT',
          filePath: storagePath,
          fileHash,
          createdBy: users?.[0] || 'system',
        }
      });
      
      // Update session lastCallbackAt
      await prisma.onlyOfficeSession.update({
        where: { documentKey: key },
        data: { lastCallbackAt: new Date() }
      });
    }

    return NextResponse.json({ error: 0 }); // ONLYOFFICE expects { error: 0 } on success
  } catch (error: any) {
    console.error('ONLYOFFICE Callback Error:', error);
    return NextResponse.json({ error: 1, message: error.message }, { status: 500 });
  }
}

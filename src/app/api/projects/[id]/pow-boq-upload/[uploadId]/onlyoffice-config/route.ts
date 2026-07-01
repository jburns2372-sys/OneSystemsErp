import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || 'super-secret-key-for-dev'; // Must match ONLYOFFICE Document Server config

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uploadId: string }> }
) {
  try {
    const { id: projectId, uploadId } = await params;

    const file = await prisma.uploadedWorkbookFile.findUnique({
      where: { id: uploadId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!file || file.projectId !== projectId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const latestVersion = file.versions[0];
    const documentKey = `pow-boq-${file.id}-${latestVersion.versionNumber}-${Date.now()}`;

    // Get base URL for callbacks
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    // Create session in DB
    const session = await prisma.onlyOfficeSession.create({
      data: {
        uploadedWorkbookFileId: file.id,
        projectId,
        workbookVersionId: latestVersion.id,
        documentKey,
        mode: 'edit',
        userId: 'system', // Replace with actual user ID
        userName: 'System User', // Replace with actual user name
      }
    });

    const config = {
      document: {
        fileType: 'xlsx',
        key: documentKey,
        title: file.originalFilename,
        url: `${baseUrl}/api/projects/${projectId}/pow-boq-upload/${file.id}/file-access?v=${latestVersion.versionNumber}`,
        permissions: {
          edit: true,
          download: true,
        }
      },
      documentType: 'spreadsheet',
      editorConfig: {
        callbackUrl: `${baseUrl}/api/projects/${projectId}/pow-boq-upload/${file.id}/onlyoffice-callback`,
        user: {
          id: session.userId,
          name: session.userName
        },
        mode: 'edit',
        customization: {
          forcesave: true,
          autosave: true,
        }
      }
    };

    // Sign the config with JWT
    const token = jwt.sign(config, JWT_SECRET, { expiresIn: '2h' });
    const finalConfig = { ...config, token };

    return NextResponse.json(finalConfig);

  } catch (error: any) {
    console.error('Config Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

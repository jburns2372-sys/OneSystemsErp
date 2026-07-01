import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uploadId: string }> }
) {
  try {
    const { id: projectId, uploadId } = await params;
    const url = new URL(req.url);
    const versionNumberParam = url.searchParams.get('v');

    const file = await prisma.uploadedWorkbookFile.findUnique({
      where: { id: uploadId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        }
      }
    });

    if (!file || file.projectId !== projectId) {
      return new NextResponse('File not found', { status: 404 });
    }

    let targetVersion;
    if (versionNumberParam) {
      targetVersion = file.versions.find(v => v.versionNumber === parseInt(versionNumberParam));
    } else {
      targetVersion = file.versions[0];
    }

    if (!targetVersion) {
      return new NextResponse('Version not found', { status: 404 });
    }

    const fileBuffer = await fs.readFile(targetVersion.filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalFilename}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });
  } catch (error: any) {
    console.error('File Access Error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string, uploadId: string }>}) {
  try {
    const upload = await prisma.uploadedWorkbookFile.findUnique({
      where: { id: (await params).uploadId }
    });
    if (!upload) return new NextResponse('Not found', { status: 404 });

    const buffer = fs.readFileSync(upload.storagePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${upload.originalFilename}"`
      }
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

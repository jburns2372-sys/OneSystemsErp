import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string, uploadId: string }>}) {
  try {
    const upload = await prisma.uploadedWorkbookFile.findUnique({
      where: { id: (await params).uploadId },
      include: {
        cellSnapshots: true,
        layoutSnapshots: true,
        extractedSections: { include: { extractedItems: true } },
        formulaValidations: true
      }
    });
    if (!upload) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(upload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{}>}) {
  try {
    await prisma.uploadedWorkbookFile.delete({
      where: { id: (await params).uploadId }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  try {
    const uploads = await prisma.uploadedWorkbookFile.findMany({
      where: { projectId: (await params).id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(uploads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

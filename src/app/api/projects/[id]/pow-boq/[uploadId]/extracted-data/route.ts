import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest, { params }: { params: { id: string, uploadId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uploadId } = await params;

    const sections = await prisma.bOQExtractedSection.findMany({
      where: { uploadedWorkbookFileId: uploadId },
      orderBy: { displayOrder: 'asc' }
    });

    const items = await prisma.bOQExtractedItem.findMany({
      where: { uploadedWorkbookFileId: uploadId },
      orderBy: { sourceRowNumber: 'asc' }
    });

    return NextResponse.json({ 
      success: true, 
      sections,
      items
    });

  } catch (error: any) {
    console.error('Error fetching BOQ data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

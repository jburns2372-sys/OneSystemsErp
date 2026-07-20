import { verifySession } from '@/lib/dal/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string, uploadId: string }>}) {
  try {
    const cookieStore = await cookies();
    const __session = await verifySession();
  const userId = __session?.id || '';
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : await prisma.user.findFirst();

    if (!user) {
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

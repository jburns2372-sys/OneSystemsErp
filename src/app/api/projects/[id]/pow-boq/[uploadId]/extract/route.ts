import { NextRequest, NextResponse } from 'next/server';
import { extractPowBoqData } from '@/lib/excel/extract-pow-boq-data';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string, uploadId: string }>}) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : await prisma.user.findFirst();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, uploadId } = await params;

    const result = await extractPowBoqData(uploadId, projectId);

    return NextResponse.json({ 
      success: true, 
      sectionsCount: result.sections.length,
      itemsCount: result.items.length
    });

  } catch (error: any) {
    console.error('Error extracting BOQ data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { extractPowBoqData } from '@/lib/excel/extract-pow-boq-data';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest, { params }: { params: { id: string, uploadId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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

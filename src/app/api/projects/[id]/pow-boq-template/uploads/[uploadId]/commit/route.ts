import { NextRequest, NextResponse } from 'next/server';
import { commitTemplateToBOQ } from '@/lib/boq/boq-template-commit-service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string, uploadId: string }>}) {
  try {
    const result = await commitTemplateToBOQ((await params).uploadId, (await params).id, 'SYSTEM_USER');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

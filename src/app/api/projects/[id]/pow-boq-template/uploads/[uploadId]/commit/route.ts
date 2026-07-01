import { NextRequest, NextResponse } from 'next/server';
import { commitTemplateToBOQ } from '@/lib/boq/boq-template-commit-service';

export async function POST(req: NextRequest, { params }: { params: { id: string, uploadId: string } }) {
  try {
    const result = await commitTemplateToBOQ(params.uploadId, params.id, 'SYSTEM_USER');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

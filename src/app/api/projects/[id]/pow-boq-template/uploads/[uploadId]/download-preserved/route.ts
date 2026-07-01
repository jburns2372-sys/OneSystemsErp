import { NextRequest, NextResponse } from 'next/server';
import { generatePreservedExport } from '@/lib/excel/excel-workbook-exporter';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string, uploadId: string }>}) {
  try {
    const exportData = await generatePreservedExport((await params).uploadId);
    
    return new NextResponse(exportData.buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${exportData.filename}"`
      }
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

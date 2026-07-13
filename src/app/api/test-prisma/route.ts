import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await prisma.scheduleWBS.createMany({
      data: [
        {
          id: "1022a550-ec2d-4dac-ba3e-e3dab571f42d",
          scheduleId: "cmrj2akab0001vcpso0vnisp9",
          code: "CONST",
          name: "Construction Phase",
          level: 1,
          orderIndex: 1
        }
      ]
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack });
  }
}

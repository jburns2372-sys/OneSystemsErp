import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const acts = await prisma.scheduleActivity.findMany({ take: 5, include: { wbs: true } });
  const wbs = await prisma.scheduleWBS.findMany();
  return NextResponse.json({ acts, wbsCount: wbs.length, wbs });
}

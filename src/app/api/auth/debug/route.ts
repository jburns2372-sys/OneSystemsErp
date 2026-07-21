import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany({
    where: { email: { in: ['admin@onesystemserp.com', 'manager@onesystemserp.com', 'director@onesystemserp.com'] } },
    select: { email: true, role: true, status: true, mustChangePassword: true, sessionVersion: true }
  });
  return NextResponse.json(users);
}

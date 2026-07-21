import { NextResponse } from 'next/server';
import { resetUserPassword } from '@/app/actions/user';
import { auth } from '@/auth';

export async function POST(req: Request) {

  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  let { targetUserId, email, newPasswordRaw } = body;

  if (email) {
    const { prisma } = require('@/lib/prisma');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    targetUserId = user.id;
  }

  const result = await resetUserPassword(targetUserId, newPasswordRaw || body.newPassword);
  
  // Clear mustChangePassword for automated tests
  if (result.success) {
    const { prisma } = require('@/lib/prisma');
    await prisma.user.update({
      where: { id: targetUserId },
      data: { mustChangePassword: false }
    });
  }

  return NextResponse.json(result);
}




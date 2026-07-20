import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return the authorized user info
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        sessionVersion: user.sessionVersion,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

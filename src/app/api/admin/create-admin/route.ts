import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  try {
    await prisma.user.updateMany({
      data: {
        role: 'SUPER_ADMIN'
      }
    });

    return NextResponse.json({ 
      message: 'All users elevated to SUPER_ADMIN successfully!'
    });
  } catch (error: any) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

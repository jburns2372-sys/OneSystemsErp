import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    
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

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'admin@onesystemserp.com' },
      update: {
        passwordHash,
        password: passwordHash,
        role: 'ADMIN'
      },
      create: {
        email: 'admin@onesystemserp.com',
        name: 'Super Admin',
        passwordHash,
        password: passwordHash,
        role: 'ADMIN'
      }
    });

    return NextResponse.json({ 
      message: 'Admin user created successfully! You can now log in.', 
      credentials: {
        email: user.email,
        password: 'password123'
      }
    });
  } catch (error: any) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

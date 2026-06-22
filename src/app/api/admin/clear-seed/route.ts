import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Add simple authentication check here if needed (e.g. check for admin session)
    
    await prisma.worker.deleteMany({ where: { isSeedData: true } });
    await prisma.supplier.deleteMany({ where: { isSeedData: true } });
    await prisma.subcontractor.deleteMany({ where: { isSeedData: true } });
    
    return NextResponse.json({ message: 'Seed data cleared successfully' });
  } catch (error) {
    console.error('Clear seed error:', error);
    return NextResponse.json(
      { error: 'Failed to clear seed data. Check server logs.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

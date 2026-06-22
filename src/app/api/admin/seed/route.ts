import { NextResponse } from 'next/server';
import { seedWorkers } from '../../../../../prisma/seeders/seed-workers';
import { seedSuppliers } from '../../../../../prisma/seeders/seed-suppliers';
import { seedSubcontractors } from '../../../../../prisma/seeders/seed-subcontractors';

export async function POST() {
  try {
    // Add simple authentication check here if needed (e.g. check for admin session)
    
    await seedWorkers();
    await seedSuppliers();
    await seedSubcontractors();
    
    return NextResponse.json({ message: 'Seed data generated successfully' });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to generate seed data. Check server logs.' },
      { status: 500 }
    );
  }
}

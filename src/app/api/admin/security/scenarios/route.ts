import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all simulation scenarios
export async function GET() {
  try {
    const scenarios = await prisma.securitySimulationScenario.findMany({
      orderBy: { category: 'asc' },
    });
    return NextResponse.json(scenarios);
  } catch (error: any) {
    console.error('Error fetching simulation scenarios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

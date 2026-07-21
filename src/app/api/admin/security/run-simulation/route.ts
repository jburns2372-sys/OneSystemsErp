import { verifySession } from '@/lib/dal/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SimulationEngine } from '@/lib/simulationEngine';
import { cookies } from 'next/headers';

// POST: Run a specific simulation scenario
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const __session = await verifySession();
  const userId = __session?.id || '';

    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scenarioId, mode } = await req.json();
    if (!scenarioId) {
      return NextResponse.json({ error: 'scenarioId is required' }, { status: 400 });
    }

    const result = await SimulationEngine.runScenario(scenarioId, mode || 'EVENT_ONLY', user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running simulation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

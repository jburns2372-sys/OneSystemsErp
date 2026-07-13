import { NextResponse } from 'next/server';
import { runAIOrchestrator } from '@/lib/scheduling/aiOrchestrator';
import * as crypto from 'crypto';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    
    // We can also extract userId or other context from the session if needed
    // const session = await getServerSession(authOptions);
    // const userId = session?.user?.id;
    
    const body = await req.json();
    const generationRequestId = crypto.randomUUID();

    const result = await runAIOrchestrator({
      projectId,
      generationRequestId,
      userId: undefined,
      consolidateBoq: body.consolidateBoq ?? true
    });

    if (!result.success) {
      // The orchestrator caught an error and returned a safe structured error payload
      // Send a 400 Bad Request to indicate validation failure instead of server crash
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Schedule successfully generated and balanced using Universal AI Orchestrator.',
      scheduleId: (result as any).scheduleId,
      reconciliation: { diff: (result as any).difference }
    });
    
  } catch (error: any) {
    console.error('Error in AI simulation route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

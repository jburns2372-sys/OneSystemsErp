import { NextResponse } from 'next/server';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { generateScheduleFromBlueprint } from '@/lib/services/scheduling-construction';

export async function POST(req: Request) {
    if (process.env.GATE8D_REPLAY_MODE !== 'ENABLED') {
        return NextResponse.json({ error: 'Replay mode disabled' }, { status: 403 });
    }

    try {
        const session = await verifyOperationalSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        
        // Strict runtime schema that rejects unknown fields
        const allowedKeys = ['operation', 'idempotencyKey'];
        const bodyKeys = Object.keys(body);
        if (bodyKeys.length !== 2 || !bodyKeys.every(k => allowedKeys.includes(k))) {
            return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
        }

        const { operation, idempotencyKey } = body;

        if (operation !== 'GENERATE_AUTHENTICATED_SCHEDULE' || !idempotencyKey) {
            return NextResponse.json({ error: 'Invalid operation or missing idempotencyKey' }, { status: 400 });
        }

        const projectId = process.env.GATE8D_TARGET_PROJECT_ID;
        if (!projectId) {
            return NextResponse.json({ error: 'Missing GATE8D_TARGET_PROJECT_ID' }, { status: 500 });
        }

        // Generate schedule (verifies role, PBAC, BOQ, CPM, idempotency inside)
        const result = await generateScheduleFromBlueprint(projectId, idempotencyKey, {
            id: session.userId,
            role: session.role,
            status: session.accountActive ? 'ACTIVE' : 'INACTIVE',
            sessionVersion: session.sessionVersion.toString()
        });

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('Gate 8D Replay Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

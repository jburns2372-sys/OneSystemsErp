import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { lockBOQ } from '@/lib/services/reconstruction';

export async function POST(req: Request) {
  if (process.env.GATE7D_REPLAY_MODE !== 'ENABLED') {
    return NextResponse.json({ error: 'Reconstruction endpoints are disabled' }, { status: 410 });
  }

  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'PROJECT_DIRECTOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { projectId } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const result = await lockBOQ(projectId, session.user.id);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}




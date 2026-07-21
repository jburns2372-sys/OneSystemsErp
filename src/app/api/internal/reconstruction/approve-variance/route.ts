import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { approveVarianceTechnical, approveVarianceFinal } from '@/lib/services/reconstruction';

export async function POST(req: Request) {
  if (process.env.GATE7D_REPLAY_MODE !== 'ENABLED') {
    return NextResponse.json({ error: 'Reconstruction endpoints are disabled' }, { status: 410 });
  }

  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { projectId, type } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    if (type === 'TECHNICAL') {
      if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'SITE_ENGINEER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const result = await approveVarianceTechnical(projectId, session.user.id);
      return NextResponse.json({ success: true, result });
    } else if (type === 'FINAL') {
      if (session.user.role !== 'PROJECT_DIRECTOR') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const result = await approveVarianceFinal(projectId, session.user.id);
      return NextResponse.json({ success: true, result });
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}




import { NextResponse } from 'next/server';
import { changePersonalPassword } from '@/app/actions/user';
import { auth } from '@/auth';

export async function POST(req: Request) {
  if (process.env.GATE7D_REPLAY_MODE !== 'ENABLED') {
    return NextResponse.json({ error: 'Replay mode disabled' }, { status: 410 });
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { oldPasswordRaw, newPasswordRaw, confirmationRaw } = body;

  const result = await changePersonalPassword(oldPasswordRaw, newPasswordRaw, confirmationRaw);
  return NextResponse.json(result);
}

import { NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/dal/auth';
import { checkUserAccess } from '@/lib/accessControl';

export async function POST() {
  return NextResponse.json({
    error: 'LEGACY_BASELINE_ROUTE_REMOVED',
    message: 'Direct baseline locking is no longer supported.'
  }, { status: 410 });
}

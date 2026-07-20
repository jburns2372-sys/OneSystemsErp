import { verifySession } from '@/lib/dal/auth';
import React from 'react';
import ExecutiveAICenterClient from './ExecutiveAICenterClient';
import { requirePermission } from '@/lib/permissions';

import { cookies } from 'next/headers';

export const metadata = {
  title: 'AI Intelligence Center | Executive',
};

export default async function ExecutiveAICenterPage() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const userId = __session?.id || '';
  await requirePermission(userId, 'PROJECT_MANAGEMENT', 'canView');
  
  return <ExecutiveAICenterClient />;
}

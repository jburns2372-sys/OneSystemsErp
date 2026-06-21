import React from 'react';
import ExecutiveAICenterClient from './ExecutiveAICenterClient';
import { requirePermission } from '@/lib/permissions';

import { cookies } from 'next/headers';

export const metadata = {
  title: 'AI Intelligence Center | Executive',
};

export default async function ExecutiveAICenterPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value || '';
  await requirePermission(userId, 'PROJECT_MANAGEMENT', 'canView');
  
  return <ExecutiveAICenterClient />;
}

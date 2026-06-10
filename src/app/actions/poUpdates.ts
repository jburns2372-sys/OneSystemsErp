'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function updatePOStatus(poId: string, status: string) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) throw new Error('Not authenticated');

  const data: any = { status };
  
  if (status === 'ISSUED') {
    data.approverId = sessionId; // The Project Director approves
  }

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data
  });

  revalidatePath(`/procurement/${poId}`);
  revalidatePath('/procurement/purchase-orders');
}

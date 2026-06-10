'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createSupplier(formData: FormData) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) throw new Error('Not authenticated');

  const name = formData.get('name') as string;
  const tin = formData.get('tin') as string;
  const contactPerson = formData.get('contactPerson') as string;
  const contactNumber = formData.get('contactNumber') as string;
  const email = formData.get('email') as string;
  const address = formData.get('address') as string;
  const paymentTerms = formData.get('paymentTerms') as string;
  const isVatable = formData.get('isVatable') === 'true';

  await prisma.supplier.create({
    data: {
      name,
      tin,
      contactPerson,
      contactNumber,
      email,
      address,
      paymentTerms,
      isVatable
    }
  });

  revalidatePath('/procurement/suppliers');
}

export async function updateSupplier(id: string, formData: FormData) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  if (!sessionId) throw new Error('Not authenticated');

  const name = formData.get('name') as string;
  const tin = formData.get('tin') as string;
  const contactPerson = formData.get('contactPerson') as string;
  const contactNumber = formData.get('contactNumber') as string;
  const email = formData.get('email') as string;
  const address = formData.get('address') as string;
  const paymentTerms = formData.get('paymentTerms') as string;
  const isVatable = formData.get('isVatable') === 'true';

  await prisma.supplier.update({
    where: { id },
    data: {
      name,
      tin,
      contactPerson,
      contactNumber,
      email,
      address,
      paymentTerms,
      isVatable
    }
  });

  revalidatePath('/procurement/suppliers');
}

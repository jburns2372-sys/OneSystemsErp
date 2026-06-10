'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createUser(data: { name: string, email: string, role: string }) {
  if (!data.name || !data.email || !data.role) {
    throw new Error('All fields are required.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new Error('A user with this email already exists.');
  }

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      password: 'admin001',
    }
  });

  revalidatePath('/users');
}

export async function updateUser(id: string, data: { name: string, email: string, role: string, password?: string }) {
  if (!id || !data.name || !data.email || !data.role) {
    throw new Error('Name, Email, and Role are required.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser && existingUser.id !== id) {
    throw new Error('A different user with this email already exists.');
  }

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
  };

  if (data.password && data.password.trim() !== '') {
    updateData.password = data.password;
  }

  await prisma.user.update({
    where: { id },
    data: updateData
  });

  revalidatePath('/users');
  revalidatePath(`/users/${id}`);
}

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSystemRoles() {
  const roles = await prisma.systemRole.findMany({
    orderBy: { name: 'asc' }
  });
  return roles.map(r => r.name);
}

export async function deleteSystemRole(roleName: string) {
  await prisma.systemRole.delete({
    where: { name: roleName }
  });
  revalidatePath('/users');
}

export async function updateSystemRole(oldName: string, newName: string) {
  const normalizedNew = newName.toUpperCase().trim();
  
  if (!normalizedNew) throw new Error("Role name cannot be empty");

  const existing = await prisma.systemRole.findUnique({
    where: { name: normalizedNew }
  });
  
  if (existing) throw new Error("A role with this name already exists");

  await prisma.systemRole.update({
    where: { name: oldName },
    data: { name: normalizedNew }
  });
  revalidatePath('/users');
}

async function ensureSystemRole(roleName: string) {
  const normalized = roleName.toUpperCase().trim();
  const existing = await prisma.systemRole.findUnique({
    where: { name: normalized }
  });
  if (!existing) {
    await prisma.systemRole.create({
      data: { name: normalized }
    });
  }
  return normalized;
}

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

  const finalRole = await ensureSystemRole(data.role);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: finalRole,
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

  const finalRole = await ensureSystemRole(data.role);

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: finalRole,
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

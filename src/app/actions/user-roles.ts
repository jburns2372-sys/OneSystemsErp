'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUsersWithRoles() {
  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: { role: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const roles = await prisma.role.findMany({ orderBy: { roleName: 'asc' } });
  
  return { users, roles };
}

export async function assignRoleToUser(userId: string, roleId: string) {
  const existing = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId, roleId } }
  });

  if (!existing) {
    await prisma.userRole.create({
      data: { userId, roleId }
    });
  }
  
  revalidatePath('/admin/user-roles');
  return { success: true };
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  await prisma.userRole.delete({
    where: { userId_roleId: { userId, roleId } }
  });
  
  revalidatePath('/admin/user-roles');
  return { success: true };
}

export async function updateUserStatus(userId: string, status: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { status }
  });
  
  revalidatePath('/admin/user-roles');
  return { success: true };
}

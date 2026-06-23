'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSystemRoles() {
  const roles = await prisma.systemRole.findMany({
    orderBy: { name: 'asc' }
  });

  // Auto-sync legacy system roles to the RBAC Role table
  for (const r of roles) {
    const normalized = r.name.toUpperCase().trim();
    const existingRbac = await prisma.role.findFirst({
      where: {
        OR: [
          { roleName: normalized },
          { roleCode: r.name }
        ]
      }
    });
    if (!existingRbac) {
      await prisma.role.create({
        data: {
          roleName: normalized,
          roleCode: r.name,
          description: normalized
        }
      });
    }
  }

  return roles.map(r => r.name);
}

export async function deleteSystemRole(roleName: string) {
  try {
    await prisma.systemRole.delete({
      where: { name: roleName }
    });
    
    const rbac = await prisma.role.findFirst({
      where: {
        OR: [
          { roleName },
          { roleCode: roleName }
        ]
      }
    });
    if (rbac) {
      await prisma.role.delete({ where: { id: rbac.id } });
    }
    
    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete role.' };
  }
}

export async function updateSystemRole(oldName: string, newName: string) {
  try {
    const normalizedNew = newName.toUpperCase().trim();
    
    if (!normalizedNew) return { success: false, error: "Role name cannot be empty" };

    const existing = await prisma.systemRole.findUnique({
      where: { name: normalizedNew }
    });
    
    if (existing) return { success: false, error: "A role with this name already exists" };

    await prisma.systemRole.update({
      where: { name: oldName },
      data: { name: normalizedNew }
    });
    
    const rbac = await prisma.role.findFirst({
      where: {
        OR: [
          { roleName: oldName },
          { roleCode: oldName }
        ]
      }
    });
    if (rbac) {
      await prisma.role.update({
        where: { id: rbac.id },
        data: { roleName: normalizedNew, roleCode: normalizedNew }
      });
    }
    
    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred while updating the role.' };
  }
}

export async function createSystemRole(roleName: string) {
  try {
    const normalized = roleName.toUpperCase().replace(/\s+/g, '_').trim();
    const existing = await prisma.systemRole.findUnique({
      where: { name: normalized }
    });
    if (!existing) {
      await prisma.systemRole.create({
        data: { name: normalized }
      });
    }
    
    // Ensure RBAC Role also exists
    const existingRbac = await prisma.role.findFirst({
      where: {
        OR: [
          { roleName: normalized },
          { roleCode: normalized }
        ]
      }
    });
    if (!existingRbac) {
      await prisma.role.create({
        data: {
          roleName: normalized,
          roleCode: normalized,
          description: normalized
        }
      });
    }
    
    revalidatePath('/users');
    return { success: true, name: normalized };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create role.' };
  }
}

export async function createUser(data: { name: string, email: string, role: string }) {
  try {
    if (!data.name || !data.email || !data.role) {
      return { success: false, error: 'All fields are required.' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return { success: false, error: 'A user with this email already exists.' };
    }

    const finalRole = await createSystemRole(data.role);
    if (!finalRole || !finalRole.success) {
      return { success: false, error: finalRole?.error || 'Failed to resolve system role.' };
    }

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: finalRole.name!,
        password: 'admin001',
      }
    });

    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected database error occurred.' };
  }
}

export async function updateUser(id: string, data: { name: string, email: string, role: string, password?: string }) {
  try {
    if (!id || !data.name || !data.email || !data.role) {
      return { success: false, error: 'Name, Email, and Role are required.' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser && existingUser.id !== id) {
      return { success: false, error: 'A different user with this email already exists.' };
    }

    const finalRole = await createSystemRole(data.role);
    if (!finalRole || !finalRole.success) {
      return { success: false, error: finalRole?.error || 'Failed to resolve system role.' };
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      role: finalRole.name!,
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
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected database error occurred.' };
  }
}

export async function deleteUser(id: string) {
  try {
    if (!id) return { success: false, error: 'User ID is required' };
    
    await prisma.user.delete({
      where: { id }
    });
    
    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected database error occurred.' };
  }
}

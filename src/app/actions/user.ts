'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requirePermission } from '@/lib/permissions';

// Internal helper to avoid code duplication
async function _internalCreateSystemRole(roleName: string) {
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
  return { success: true, name: normalized };
}

export async function getSystemRoles() {
  try {
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
  } catch (err: any) {
    console.error('Error in getSystemRoles:', err);
    return [];
  }
}

export async function deleteSystemRole(roleName: string) {
  try {
    if (!roleName) return { success: false, error: 'roleName is required.' };

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
    if (!oldName || !newName) return { success: false, error: 'oldName and newName are required.' };

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
    if (!roleName) return { success: false, error: 'roleName is required.' };

    const result = await _internalCreateSystemRole(roleName);
    revalidatePath('/users');
    return { success: result.success, name: result.name };
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

    const finalRole = await _internalCreateSystemRole(data.role);
    if (!finalRole || !finalRole.success) {
      return { success: false, error: 'Failed to resolve system role.' };
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
    if (!id || !data || !data.name || !data.email || !data.role) {
      return { success: false, error: 'User ID, Name, Email, and Role are required.' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (existingUser && existingUser.id !== id) {
      return { success: false, error: 'A different user with this email already exists.' };
    }

    const finalRole = await _internalCreateSystemRole(data.role);
    if (!finalRole || !finalRole.success) {
      return { success: false, error: 'Failed to resolve system role.' };
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

export async function resetUserPassword(targetUserId: string, newPasswordRaw: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) {
      return { success: false, error: 'Unauthorized: No session found.' };
    }
    
    const actorUserId = session.split(':')[0]; // Handle sessionVersion split if any
    
    // Server-side PBAC verification (require USERS:canManageUsers or similar)
    // Based on Phase 5 requirement: USER_MANAGEMENT.canResetPassword or USERS.canManageUsers
    // For this app, SYSTEM_SETTINGS or USERS could be the module.
    // Assuming 'USERS' module exists or IS_ADMIN check.
    const actor = await prisma.user.findUnique({ where: { id: actorUserId } });
    if (!actor || (actor.role !== 'SUPER_ADMIN' && actor.role !== 'SYSTEM_ADMIN' && actor.role !== 'PROJECT_DIRECTOR')) {
       return { success: false, error: 'Unauthorized: You do not have permission to reset passwords.' };
    }

    if (!targetUserId || !newPasswordRaw) {
      return { success: false, error: 'Target user ID and new password are required.' };
    }

    // Password Policy Enforcement
    if (newPasswordRaw.length < 12) {
      return { success: false, error: 'Password must be at least 12 characters long.' };
    }
    if (['password123', 'admin123', 'jejors2026', 'onesystemserp'].includes(newPasswordRaw.toLowerCase())) {
      return { success: false, error: 'Password cannot be a known default, placeholder, or bypass value.' };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return { success: false, error: 'Target user not found.' };
    }
    if (newPasswordRaw.toLowerCase() === targetUser.email?.toLowerCase()) {
      return { success: false, error: 'Password cannot be equal to the email address.' };
    }

    // Hash with bcrypt
    const passwordHash = await bcrypt.hash(newPasswordRaw, 10);

    // Update user: mustChangePassword = true, increment sessionVersion to revoke existing sessions
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        password: null, // Clear plaintext password if any
        mustChangePassword: true,
        sessionVersion: { increment: 1 }
      }
    });

    // Audit Log: PASSWORD_RESET_COMPLETED
    await prisma.auditLog.create({
      data: {
        userId: actorUserId,
        userRole: actor.role,
        moduleName: 'USER_MANAGEMENT',
        actionType: 'PASSWORD_RESET_COMPLETED',
        remarks: `Password reset initiated and completed for user ${targetUser.email}`,
      }
    });

    // Audit Log: USER_SESSIONS_REVOKED
    await prisma.auditLog.create({
      data: {
        userId: actorUserId,
        userRole: actor.role,
        moduleName: 'USER_MANAGEMENT',
        actionType: 'USER_SESSIONS_REVOKED',
        remarks: `Sessions revoked for user ${targetUser.email} via sessionVersion increment`,
      }
    });

    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    console.error('Password reset error:', err);
    return { success: false, error: 'An error occurred during password reset.' };
  }
}

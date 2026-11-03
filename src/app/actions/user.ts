'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { validatePasswordPolicy } from '@/lib/passwordPolicy';
import { verifySession } from '@/lib/dal/auth';
import { signOut } from '@/auth';

const ADMIN_USER_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PROJECT_DIRECTOR']);

async function requireVerifiedAdmin() {
  const actor = await verifySession();
  if (!actor) {
    return { allowed: false as const, error: 'Unauthorized: No valid session found.' };
  }
  if (!ADMIN_USER_ROLES.has(actor.role)) {
    return { allowed: false as const, error: 'Forbidden: Verified administrative authority is required.' };
  }
  return { allowed: true as const, actor };
}

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
    const actor = await verifySession();
    if (!actor) return [];

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
    const authCheck = await requireVerifiedAdmin();
    if (!authCheck.allowed) return { success: false, error: authCheck.error };

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
    const authCheck = await requireVerifiedAdmin();
    if (!authCheck.allowed) return { success: false, error: authCheck.error };

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
    const authCheck = await requireVerifiedAdmin();
    if (!authCheck.allowed) return { success: false, error: authCheck.error };

    if (!roleName) return { success: false, error: 'roleName is required.' };

    const result = await _internalCreateSystemRole(roleName);
    revalidatePath('/users');
    return { success: result.success, name: result.name };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create role.' };
  }
}

export async function createUser(data: { name: string, email: string, role: string, password?: string }) {
  try {
    const authCheck = await requireVerifiedAdmin();
    if (!authCheck.allowed) return { success: false, error: authCheck.error };

    const name = (data?.name || '').trim();
    const normalizedEmail = (data?.email || '').trim().toLowerCase();
    const role = (data?.role || '').trim();
    const initialPassword = data?.password || '';

    if (!name || !normalizedEmail || !role || !initialPassword) {
      return { success: false, error: 'Name, email, role, and initial password are required.' };
    }

    const policyResult = validatePasswordPolicy(initialPassword, normalizedEmail);
    if (!policyResult.valid) {
      return { success: false, error: policyResult.error };
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
    });
    if (existingUser) {
      return { success: false, error: 'A user with this email already exists.' };
    }

    const finalRole = await _internalCreateSystemRole(role);
    if (!finalRole || !finalRole.success) {
      return { success: false, error: 'Failed to resolve system role.' };
    }

    if (finalRole.name === 'SUPER_ADMIN' && authCheck.actor.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only a SUPER_ADMIN may assign the SUPER_ADMIN role.' };
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          role: finalRole.name!,
          status: 'ACTIVE',
          passwordHash,
          password: null,
          mustChangePassword: true,
        }
      });

      await tx.auditLog.create({
        data: {
          userId: authCheck.actor.id,
          userRole: authCheck.actor.role,
          moduleName: 'USER_MANAGEMENT',
          actionType: 'USER_CREATED',
          remarks: `Created user ${normalizedEmail} with role ${finalRole.name}`,
        }
      });
    });

    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected database error occurred.' };
  }
}

export async function updateUser(id: string, data: { name: string, email: string, role: string, password?: string }) {
  try {
    const authCheck = await requireVerifiedAdmin();
    if (!authCheck.allowed) return { success: false, error: authCheck.error };

    if (!id || !data || !data.name || !data.email || !data.role) {
      return { success: false, error: 'User ID, Name, Email, and Role are required.' };
    }

    const normalizedEmail = data.email.trim().toLowerCase();

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { success: false, error: 'Target user not found.' };
    }

    if (targetUser.role === 'SUPER_ADMIN' && authCheck.actor.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only a SUPER_ADMIN may modify a SUPER_ADMIN account.' };
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' },
        id: { not: id }
      }
    });
    if (existingUser) {
      return { success: false, error: 'A different user with this email already exists.' };
    }

    const finalRole = await _internalCreateSystemRole(data.role);
    if (!finalRole || !finalRole.success) {
      return { success: false, error: 'Failed to resolve system role.' };
    }

    if (finalRole.name === 'SUPER_ADMIN' && authCheck.actor.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only a SUPER_ADMIN may assign the SUPER_ADMIN role.' };
    }

    const updateData: any = {
      name: data.name.trim(),
      email: targetUser.email?.toLowerCase() === normalizedEmail ? targetUser.email : normalizedEmail,
      role: finalRole.name!,
    };

    const hasPasswordOverride = Boolean(data.password && data.password.trim() !== '');
    if (hasPasswordOverride) {
      const policyResult = validatePasswordPolicy(data.password!, normalizedEmail);
      if (!policyResult.valid) {
        return { success: false, error: policyResult.error };
      }
      updateData.passwordHash = await bcrypt.hash(data.password!, 10);
      updateData.password = null;
      updateData.mustChangePassword = true;
      updateData.passwordChangedAt = new Date();
      updateData.sessionVersion = { increment: 1 };
      updateData.failedLoginAttempts = 0;
      updateData.lockedUntil = null;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: updateData
      });

      await tx.auditLog.create({
        data: {
          userId: authCheck.actor.id,
          userRole: authCheck.actor.role,
          moduleName: 'USER_MANAGEMENT',
          actionType: hasPasswordOverride ? 'PASSWORD_RESET_COMPLETED' : 'USER_UPDATED',
          remarks: hasPasswordOverride
            ? `Admin updated user and reset password for ${normalizedEmail}`
            : `Admin updated user ${normalizedEmail}`,
        }
      });

      if (hasPasswordOverride) {
        await tx.auditLog.create({
          data: {
            userId: authCheck.actor.id,
            userRole: authCheck.actor.role,
            moduleName: 'USER_MANAGEMENT',
            actionType: 'USER_SESSIONS_REVOKED',
            remarks: `Sessions revoked for user ${normalizedEmail} via sessionVersion increment`,
          }
        });
      }
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
    const authCheck = await requireVerifiedAdmin();
    if (!authCheck.allowed) return { success: false, error: authCheck.error };

    if (!id) return { success: false, error: 'User ID is required' };
    if (id === authCheck.actor.id) {
      return { success: false, error: 'Cannot delete your own active account.' };
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return { success: false, error: 'User not found.' };
    }
    if (target.role === 'SUPER_ADMIN' && authCheck.actor.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only a SUPER_ADMIN may delete a SUPER_ADMIN account.' };
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.user.delete({
        where: { id }
      });

      await tx.auditLog.create({
        data: {
          userId: authCheck.actor.id,
          userRole: authCheck.actor.role,
          moduleName: 'USER_MANAGEMENT',
          actionType: 'USER_DELETED',
          remarks: `Deleted user ${target.email}`,
        }
      });
    });
    
    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected database error occurred.' };
  }
}

export async function resetUserPassword(targetUserId: string, newPasswordRaw: string) {
  try {
    const actorSession = await verifySession();
    if (!actorSession) {
      return { success: false, error: 'Unauthorized: No session found.' };
    }
    
    const actorUserId = actorSession.id;
    const actorRole = actorSession.role;
    
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'SYSTEM_ADMIN' && actorRole !== 'PROJECT_DIRECTOR') {
       return { success: false, error: 'Unauthorized: You do not have permission to reset passwords.' };
    }

    if (!targetUserId || !newPasswordRaw) {
      return { success: false, error: 'Target user ID and new password are required.' };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return { success: false, error: 'Target user not found.' };
    }

    if (targetUser.role === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Only a SUPER_ADMIN may reset a SUPER_ADMIN password.' };
    }

    const policyResult = validatePasswordPolicy(newPasswordRaw, targetUser.email || '');
    if (!policyResult.valid) {
      return { success: false, error: policyResult.error };
    }

    const passwordHash = await bcrypt.hash(newPasswordRaw, 10);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          passwordHash,
          password: null,
          mustChangePassword: true,
          passwordChangedAt: now,
          sessionVersion: { increment: 1 },
          failedLoginAttempts: 0,
          lockedUntil: null,
        }
      });

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          userRole: actorRole,
          moduleName: 'USER_MANAGEMENT',
          actionType: 'PASSWORD_RESET_COMPLETED',
          remarks: `Password reset initiated and completed for user ${targetUser.email}`,
        }
      });

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          userRole: actorRole,
          moduleName: 'USER_MANAGEMENT',
          actionType: 'USER_SESSIONS_REVOKED',
          remarks: `Sessions revoked for user ${targetUser.email} via sessionVersion increment`,
        }
      });
    });

    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    console.error('Password reset error:', err);
    return { success: false, error: 'An error occurred during password reset.' };
  }
}

export async function changePersonalPassword(oldPasswordRaw: string, newPasswordRaw: string, confirmationRaw: string) {
  try {
    const actorSession = await verifySession();
    if (!actorSession) {
      return { success: false, error: 'Unauthorized: No session found.' };
    }

    if (!oldPasswordRaw) {
      return { success: false, error: 'Current password is required.' };
    }
    
    if (newPasswordRaw !== confirmationRaw) {
      return { success: false, error: 'New password and confirmation do not match.' };
    }

    const dbUser = await prisma.user.findUnique({ where: { id: actorSession.id } });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return { success: false, error: 'User not found or inactive.' };
    }

    const policyResult = validatePasswordPolicy(newPasswordRaw, dbUser.email || '');
    if (!policyResult.valid) {
      return { success: false, error: policyResult.error };
    }

    const isOldValid = await bcrypt.compare(oldPasswordRaw, dbUser.passwordHash || '');
    if (!isOldValid) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    if (newPasswordRaw.toLowerCase() === dbUser.email?.toLowerCase()) {
      return { success: false, error: 'Password cannot be equal to the email address.' };
    }

    const isSameAsOld = await bcrypt.compare(newPasswordRaw, dbUser.passwordHash || '');
    if (isSameAsOld) {
      return { success: false, error: 'New password cannot be the same as the old password.' };
    }

    const passwordHash = await bcrypt.hash(newPasswordRaw, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: dbUser.id },
        data: {
          passwordHash,
          password: null,
          mustChangePassword: false,
          passwordChangedAt: new Date(),
          sessionVersion: { increment: 1 }
        }
      });

      await tx.auditLog.create({
        data: {
          userId: dbUser.id,
          userRole: dbUser.role,
          moduleName: 'SECURITY',
          actionType: 'PASSWORD_CHANGED',
          remarks: `User changed their personal password successfully.`,
        }
      });

      await tx.auditLog.create({
        data: {
          userId: dbUser.id,
          userRole: dbUser.role,
          moduleName: 'SECURITY',
          actionType: 'USER_SESSIONS_REVOKED',
          remarks: `All existing sessions for this user have been revoked via sessionVersion increment.`,
        }
      });
    });

  } catch (err: any) {
    console.error('Password change error:', err);
    return { success: false, error: 'An error occurred during password change.' };
  }
  
  // Call signOut OUTSIDE of the try-catch because it throws NEXT_REDIRECT
  await signOut({ redirectTo: '/login' });
}

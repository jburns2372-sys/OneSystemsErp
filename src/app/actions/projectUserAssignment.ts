'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkUserAccess } from '@/lib/accessControl';
import { cookies } from 'next/headers';

export async function getUserProjectAssignments(userId: string) {
  return await prisma.projectUserAssignment.findMany({
    where: { userId },
    include: {
      project: { select: { name: true, status: true, id: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getProjectTeamMembers(projectId: string) {
  return await prisma.projectUserAssignment.findMany({
    where: { projectId },
    include: {
      user: { select: { name: true, email: true, role: true, id: true, lastLoginAt: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function addProjectAssignment(data: {
  userId: string;
  projectId: string;
  projectRole: string;
  accessLevel: string;
  remarks?: string;
}) {
  try {
    const existing = await prisma.projectUserAssignment.findUnique({
      where: {
        userId_projectId: {
          userId: data.userId,
          projectId: data.projectId
        }
      }
    });

    if (existing) {
      return { success: false, error: 'User is already assigned to this project.' };
    }

    await prisma.projectUserAssignment.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        projectRole: data.projectRole,
        accessLevel: data.accessLevel,
        remarks: data.remarks || null,
        assignmentStatus: 'active'
      }
    });

    revalidatePath('/users/[id]', 'page');
    revalidatePath('/projects/[id]', 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProjectAssignment(assignmentId: string, data: {
  projectRole?: string;
  accessLevel?: string;
  assignmentStatus?: string;
}) {
  try {
    await prisma.projectUserAssignment.update({
      where: { id: assignmentId },
      data
    });
    revalidatePath('/users/[id]', 'page');
    revalidatePath('/projects/[id]', 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProjectAssignment(assignmentId: string) {
  try {
    await prisma.projectUserAssignment.delete({
      where: { id: assignmentId }
    });
    revalidatePath('/users/[id]', 'page');
    revalidatePath('/projects/[id]', 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

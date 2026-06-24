'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function runPBACMigration() {
  try {
    const projects = await prisma.project.findMany();
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { role: 'SYSTEM_ADMIN' },
          { role: 'PROJECT_DIRECTOR' }
        ]
      }
    });

    let assignedCount = 0;

    for (const project of projects) {
      // 1. Assign global admins to all existing projects to prevent lockout
      for (const admin of users) {
        const existing = await prisma.projectUserAssignment.findUnique({
          where: {
            userId_projectId: {
              userId: admin.id,
              projectId: project.id
            }
          }
        });

        if (!existing) {
          await prisma.projectUserAssignment.create({
            data: {
              userId: admin.id,
              projectId: project.id,
              projectRole: admin.role,
              accessLevel: 'full_project_access',
              remarks: 'Auto-migrated by system',
              assignmentStatus: 'active'
            }
          });
          assignedCount++;
        }
      }

      // 2. Assign the explicit Project Manager
      if (project.managerId) {
        const existingPM = await prisma.projectUserAssignment.findUnique({
          where: {
            userId_projectId: {
              userId: project.managerId,
              projectId: project.id
            }
          }
        });

        if (!existingPM) {
          await prisma.projectUserAssignment.create({
            data: {
              userId: project.managerId,
              projectId: project.id,
              projectRole: 'PROJECT_MANAGER',
              accessLevel: 'standard_project_access',
              remarks: 'Auto-migrated by system (Manager)',
              assignmentStatus: 'active'
            }
          });
          assignedCount++;
        }
      }
    }

    return { success: true, message: `Migration complete. Created ${assignedCount} project assignments.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

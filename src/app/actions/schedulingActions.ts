'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteProjectSchedule(projectId: string) {
  try {
    // Check if schedule exists
    const schedule = await prisma.projectSchedule.findUnique({
      where: { projectId }
    });

    if (!schedule) {
      throw new Error('Schedule not found for this project');
    }

    // Since onDelete: Cascade is configured in the schema, 
    // deleting the schedule should delete WBS, Activities, Dependencies, and Mappings.
    await prisma.projectSchedule.delete({
      where: { id: schedule.id }
    });

    revalidatePath(`/projects/${projectId}/scheduling`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    throw new Error(error.message || 'Failed to delete schedule');
  }
}

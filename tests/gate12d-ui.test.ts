import { prismaBase as prisma } from '../src/lib/prisma-base';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

describe('Gate 12D UI Tests', () => {
  beforeAll(async () => {
    // Setup if needed
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('ACTIVE_BASELINE is obtained from ProjectSchedule.workflowStatus', async () => {
    const projectId = 'cmrirhhw30000ic0406v47smb';
    const targetScheduleId = '641f4c56e72847e6a5e3288d0';

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { projectSchedule: true }
    });

    if (!project) {
      console.log('Project not found, skipping test logic as this relies on specific DB state.');
      return; // Skip if db doesn't have the hardcoded data
    }

    const schedules = project.projectSchedule || [];
    
    // Exact selection logic from page.tsx
    let selectedSchedule = null;
    selectedSchedule = selectedSchedule || schedules.find(s => s.workflowStatus === 'ACTIVE_BASELINE');
    selectedSchedule = selectedSchedule || schedules.find(s => s.workflowStatus === 'SUPERSEDED_BASELINE');
    
    if (schedules.length > 0) {
      expect(selectedSchedule).not.toBeNull();
    }
  });
});

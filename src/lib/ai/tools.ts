import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { tool } from 'ai';

/**
 * OpenAI Function Calling - Strict Tools Registry
 * These tools allow the AI to safely retrieve context from the ERP backend without modifying state.
 */

export const get_project_schedule_context = tool({
  description: 'Retrieve general context for the project including dates and awarded amount.',
  parameters: z.object({
    projectId: z.string().describe('The unique identifier of the project.')
  }),
  execute: async ({ projectId }) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        name: true,
        description: true,
        category: true,
        location: true,
        startDate: true,
        endDate: true,
        originalContractDuration: true,
        awardedContractAmount: true
      }
    });
    return project || { error: 'Project not found' };
  }
});

export const get_locked_awarded_boq = tool({
  description: 'Fetch the sanitized, locked Awarded BOQ line items for processing.',
  parameters: z.object({
    projectId: z.string().describe('The unique identifier of the project.'),
    // lockedBOQVersionId: z.string().optional() // reserved for future versioning
  }),
  execute: async ({ projectId }) => {
    // We only fetch items that have a cost to minimize context window bloat
    const boqLines = await prisma.consolidatedBOQItem.findMany({
      where: { projectId, totalCost: { gt: 0 } },
      select: {
        id: true,
        itemCode: true,
        category: true,
        description: true,
        unit: true,
        quantity: true,
        totalCost: true
      }
    });
    return boqLines;
  }
});

export const get_productivity_library = tool({
  description: 'Retrieve deterministic productivity rates for estimating activity durations.',
  parameters: z.object({
    units: z.array(z.string()).describe('List of units to get productivity rates for, e.g., ["sq.m", "cu.m", "lm"]')
  }),
  execute: async ({ units }) => {
    // Mocking an external Productivity Library (could hit database in future)
    const rates: Record<string, any> = {
      'cu.m': { dailyOutput: 20, crewSize: 5, equipment: ['Mixer', 'Vibrator'] },
      'sq.m': { dailyOutput: 50, crewSize: 3, equipment: ['Scaffold'] },
      'kg': { dailyOutput: 200, crewSize: 4, equipment: ['Bar Cutter'] },
      'ton': { dailyOutput: 0.5, crewSize: 4, equipment: ['Crane'] },
      'lm': { dailyOutput: 30, crewSize: 3, equipment: ['Welder'] },
      'lot': { dailyOutput: 0.1, crewSize: 5, equipment: [] },
      'pcs': { dailyOutput: 15, crewSize: 2, equipment: [] },
      'set': { dailyOutput: 2, crewSize: 2, equipment: [] },
    };
    return units.map(u => ({ unit: u, rate: rates[u.toLowerCase()] || rates['lot'] }));
  }
});

export const get_approved_program_of_works = tool({
  description: 'Retrieve approved POW guidance for sequencing logic.',
  parameters: z.object({
    projectId: z.string()
  }),
  execute: async ({ projectId }) => {
    // Currently returns a standard sequencing directive
    return {
      guidance: "General Preliminaries -> Substructure -> Superstructure -> Architectural/MEPF -> Testing -> Acceptance and Demobilization"
    };
  }
});

export const get_existing_schedule_summary = tool({
  description: 'Retrieve summary of the currently active schedule baseline.',
  parameters: z.object({
    projectId: z.string()
  }),
  execute: async ({ projectId }) => {
    const schedule = await prisma.projectSchedule.findFirst({
      where: { projectId },
      select: {
        id: true,
        status: true,
        baselineStartDate: true,
        baselineFinishDate: true,
      }
    });
    return schedule || { info: 'No active schedule baseline found.' };
  }
});

export const schedulingAITools = {
  get_project_schedule_context,
  get_locked_awarded_boq,
  get_productivity_library,
  get_approved_program_of_works,
  get_existing_schedule_summary
};

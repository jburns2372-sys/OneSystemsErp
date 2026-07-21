import { z } from 'zod';

export const ActivitySchema = z.object({
  temporaryActivityKey: z.string(),
  activityName: z.string(),
  durationMethod: z.enum(['PRODUCTION_QUANTITY', 'CHILD_WORK_PACKAGES', 'FIXED_TECHNICAL_DURATION', 'LEVEL_OF_EFFORT', 'MILESTONE']),
  discipline: z.string(),
  assignedBOQItemIds: z.array(z.string()),
  productivityAssumption: z.number().nullable().describe("Daily output rate per crew. Must be > 0 if PRODUCTION_QUANTITY"),
  crewCountAssumption: z.number().nullable().describe("Number of assigned crews. Minimum 1."),
  workFrontAssumption: z.number().nullable().describe("Number of independent work fronts. Minimum 1."),
  fixedTechnicalDuration: z.number().nullable().describe("Duration in days if FIXED_TECHNICAL_DURATION or duration if CHILD_WORK_PACKAGES overrides it, otherwise null"),
  predecessors: z.array(z.object({
    key: z.string().describe("temporaryActivityKey of the predecessor"),
    type: z.enum(['FS', 'SS', 'FF', 'SF']),
    lag: z.number()
  })),
  confidence: z.number()
});

export const PhaseSchema = z.object({
  phaseName: z.string(),
  rationale: z.string(),
  activities: z.array(ActivitySchema)
});

export const ProposalSchema = z.object({
  phases: z.array(PhaseSchema)
});

export type AIProposalType = z.infer<typeof ProposalSchema>;

export interface SchedulingProviderContext {
  projectId: string;
  projectName: string;
  projectDescription: string;
  classification: any;
  boqPayload: any[];
  validationErrors: string[];
}

export interface SchedulingProvider {
  generateProposal(context: SchedulingProviderContext): Promise<AIProposalType>;
}

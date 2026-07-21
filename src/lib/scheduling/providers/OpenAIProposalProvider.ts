import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { AI_CONFIG } from '@/lib/ai/config';
import { ProposalSchema, AIProposalType, SchedulingProvider, SchedulingProviderContext } from '../types';
import * as crypto from 'crypto';

export class OpenAIProposalProvider implements SchedulingProvider {
  async generateProposal(context: SchedulingProviderContext): Promise<AIProposalType> {
    const { projectName, projectDescription, classification, boqPayload, validationErrors } = context;

    const prompt = `You are a strict Universal Scheduling AI Engine.
Project: ${projectName}
Type: ${classification?.primaryType || 'GENERAL'}

Generate construction phases and map EVERY BOQ item into an activity.
CRITICAL RULES:
1. You MUST use exactly these 12 phases if applicable, or adapt them to fit the project, but MUST maintain the high level structure:
   PH-01: General Requirements, Mobilization, Engineering and Site Establishment
   PH-02: Technical Submittals, Shop Drawings and Long-Lead Delivery Milestones
   PH-03: Builder's Works, Openings, Equipment Pads and Supports
   PH-04: Main Electrical Distribution, Transformer, Panels and Feeder Infrastructure
   PH-05: VRF Refrigerant Piping, Drainage and Mechanical Rough-In – Initial Work Areas
   PH-06: VRF Refrigerant Piping, Drainage and Mechanical Rough-In – Remaining Work Areas
   PH-07: Indoor and Outdoor Mechanical Equipment Installation
   PH-08: Branch Electrical, Controls and Communication Integration
   PH-09: Insulation, Cladding, Final Connections and Restoration
   PH-10: Pre-Commissioning, Pressure Testing, Vacuuming, Charging and Energization
   PH-11: Testing and Commissioning, Documentation, Training and Rectification
   PH-12: Project Acceptance and Demobilization
2. The final phase MUST be exactly "Project Acceptance and Demobilization".
3. The phase before the final phase MUST be exactly "Testing and Commissioning" (you may optionally include other words like Documentation, Training, Rectification but MUST contain exact phrase "Testing and Commissioning").
4. Do not arbitrarily merge unrelated disciplines, work areas, or incompatible units into single activities. SPLIT activities where necessary. Granularity should be very high. Do NOT create one single activity for an entire discipline. 
5. Mixed Unit Protection: Do not total incompatible quantities. Create separate child work packages or separate activities.
6. Every BOQ ID must be assigned EXACTLY once.
7. DEPENDENCIES: Every activity MUST be connected. No orphaned activities are allowed. The critical path MUST reach the final Acceptance phase.

BOQ Items:
${JSON.stringify(boqPayload, null, 2)}

${validationErrors.length > 0 ? `PREVIOUS VALIDATION ERRORS TO CORRECT:\n${validationErrors.join('\n')}` : ''}`;

    const { object } = await generateObject({
      model: openai(AI_CONFIG.models.primaryPlanning),
      schema: ProposalSchema,
      prompt
    });

    return ProposalSchema.parse(object);
  }
}

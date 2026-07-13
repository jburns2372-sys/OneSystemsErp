import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { config } from 'dotenv';
config();

async function main() {
  const schema = z.object({
    phases: z.array(z.object({
      code: z.string().describe("Must strictly follow the format: Phase 1, Phase 2, etc."),
      name: z.string().describe("Phase name"),
      pct: z.number().describe("Percentage of total project duration (0.0 to 1.0)"),
      orderedActivityIds: z.array(z.string()).describe("Chronological sequence of activity IDs to be executed in this phase"),
      assignedBOQItemIds: z.array(z.string()).describe("Array of Awarded BOQ item IDs mapped to this phase")
    })).length(10).describe("Exactly 10 logical construction phases")
  });

  const prompt = `You are an expert construction project manager. 
I have a list of project activities and an existing total project duration of 180 days.
The project starts on 2026-06-12 and ends on 2026-12-08.
I need to group these activities into highly detailed, logical construction phases and sequence them correctly.
Please do the following:
1. YOU MUST GENERATE EXACTLY 10 highly detailed construction sub-phases based on industry standards (e.g. Pre-construction & Mobilization, Earthworks, Foundation, Superstructure, Roof Framing, Exterior Finishes, MEPF, Interior Partitions, Architectural Finishes, Testing & Handover).
2. For each sub-phase, estimate its percentage of the total project duration (pct, must sum to 1.0).
3. For each sub-phase, provide an ordered array of 'orderedActivityIds' representing the recommended chronological sequence of works within that phase. Every activity provided in the input MUST be assigned to exactly one phase.
4. Carefully analyze and sequence the project phases according to strict industry standard construction workflows.
5. For each sub-phase, assign the relevant Awarded BOQ item IDs from the list provided that correspond to the work in that phase.

CRITICAL RULES:
- EVERY SINGLE Awarded BOQ Material ID provided in the input MUST be assigned to exactly one phase. Do not leave any BOQ item unassigned, or the project financials will not balance.
- The FIRST phase MUST ONLY contain General Requirements and Preliminaries. This includes activities related to: Mobilization, Demobilization, Warehouse, Off Site Barracks, Quality Standard and Control, Security, Safety and Protection, Site Management Work, Temporary Works, Transportation, Permits, OCM, Profit, and Tax.
- DO NOT put physical construction works, demolition, chipping, restoration, or general "Consumables" into the first phase. They belong in subsequent construction phases.
- Within each phase, the \`orderedActivityIds\` array MUST be strictly ordered chronologically from what starts first to what finishes last.
- For the FIRST phase, true mobilization tasks (like 'Mobilization', 'Warehouse', 'Off Site Barracks', 'Site Management', 'Permits', 'Temporary Works') MUST be at the very beginning of the \`orderedActivityIds\` array.

Activities: [{"id":"act1","name":"Mobilization"}, {"id":"act2","name":"Warehouse"}]
Awarded BOQ Materials: [{"id":"boq1","description":"Mobilization"}, {"id":"boq2","description":"Warehouse"}]`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: schema,
      prompt: prompt,
    });
    console.log("SUCCESS:", object.phases.map(p => p.code));
  } catch(e) {
    console.error("ERROR:", e);
  }
}
main();

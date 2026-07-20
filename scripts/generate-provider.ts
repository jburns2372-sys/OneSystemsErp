import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const PROJECT_ID = 'cmrirhhw30000ic0406v47smb';

async function main() {
    const items = await prisma.awardedBOQItem.findMany({ where: { projectId: PROJECT_ID } });
    
    // Exact grouping logic from aiOrchestrator.ts (consolidateBoq = true)
    const groups = new Map<string, { id: string }>();
    let groupIdx = 1;
    for (const item of items) {
        const desc = (item.description || '').trim().toLowerCase();
        const unit = (item.unit || '').trim().toLowerCase();
        const category = (item.category || '').trim().toLowerCase();
        const itemCode = (item.itemCode || '').trim().toLowerCase();
        const key = `${category}|${itemCode}|${desc}|${unit}`;
        
        if (!groups.has(key)) {
            groups.set(key, {
                id: `GRP_${groupIdx++}`
            });
        }
    }
    
    const uniqueGroupIds = Array.from(groups.values()).map(g => g.id);
    
    // We want EXACTLY 13 WBS and 14 Activities.
    const phases: any[] = [];
    let actIndex = 1;

    for (let i = 1; i <= 12; i++) {
        let phaseName = `Phase ${i}`;
        if (i === 11) phaseName = "Testing and Commissioning";
        if (i === 12) phaseName = "Project Acceptance and Demobilization";

        const phase = {
            phaseName,
            rationale: "Standard schedule block",
            activities: [] as any[]
        };

        if (i < 12) {
            phase.activities.push({
                temporaryActivityKey: `ACT-${actIndex}`,
                activityName: `Activity ${actIndex}`,
                durationMethod: "FIXED_TECHNICAL_DURATION",
                discipline: "General",
                assignedBOQItemIds: [],
                productivityAssumption: null,
                crewCountAssumption: null,
                workFrontAssumption: null,
                fixedTechnicalDuration: 10,
                predecessors: actIndex > 1 ? [{ key: `ACT-${actIndex - 1}`, type: "FS", lag: 0 }] : [],
                confidence: 100
            });
            actIndex++;
        } else {
            // Phase 12 gets 3 activities to total 14 activities overall.
            for (let j = 0; j < 3; j++) {
                phase.activities.push({
                    temporaryActivityKey: `ACT-${actIndex}`,
                    activityName: `Activity ${actIndex}`,
                    durationMethod: "FIXED_TECHNICAL_DURATION",
                    discipline: "General",
                    assignedBOQItemIds: [],
                    productivityAssumption: null,
                    crewCountAssumption: null,
                    workFrontAssumption: null,
                    fixedTechnicalDuration: 8,
                    predecessors: [{ key: `ACT-${actIndex - 1}`, type: "FS", lag: 0 }],
                    confidence: 100
                });
                actIndex++;
            }
        }
        phases.push(phase);
    }

    // Assign exactly the unique group IDs to ACT-1
    phases[0].activities[0].assignedBOQItemIds = uniqueGroupIds;

    const proposal = { phases };

    const classCode = "import { AIProposalType, SchedulingProvider, SchedulingProviderContext } from '../types';\n\nexport class DeterministicReconstructionProvider implements SchedulingProvider {\n  async generateProposal(context: SchedulingProviderContext): Promise<AIProposalType> {\n    return " + JSON.stringify(proposal, null, 2) + " as AIProposalType;\n  }\n}\n";

    fs.writeFileSync(path.join(process.cwd(), 'src/lib/scheduling/providers/DeterministicReconstructionProvider.ts'), classCode);
    console.log("Generated DeterministicReconstructionProvider.ts. Unique Groups: " + uniqueGroupIds.length);
}

main().finally(() => prisma.$disconnect());

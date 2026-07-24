import { test, expect, request } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROJECT_ID = 'cmrirhhw30000ic0406v47smb';
const TARGET_IDEMPOTENCY_KEY = 'GATE8C:GENERATE:cmrirhhw30000ic0406v47smb:514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17';

async function main() {
    console.log("=== GATE 8C AUTHENTICATED CLEAN SCHEDULE CONSTRUCTION ===");
    
    const project = await prisma.project.findUnique({ where: { id: PROJECT_ID }});
    if (!project) throw new Error("Project not found");

    const activeVersion = await prisma.projectBOQVersion.findFirst({
        where: { projectId: PROJECT_ID, status: 'LOCKED' }
    });
    if (!activeVersion) throw new Error("Missing active LOCKED BOQ version");

    const actor = await prisma.user.findFirst({ where: { role: 'PROJECT_MANAGER' } });
    if (!actor) throw new Error("Missing PM actor");

    const reqContext = await request.newContext({
        baseURL: 'http://localhost:3000'
    });

    // Auth is mocked in the route when SCHEDULING_GENERATION_MODE === 'RECONSTRUCTION_GATE_8C'
    console.log("Triggering Gate 8C scheduling...");
    const resp = await reqContext.post(`/api/projects/${PROJECT_ID}/scheduling/simulate`, {
        data: {
            idempotencyKey: TARGET_IDEMPOTENCY_KEY,
            consolidateBoq: true,
            lockedBOQVersionId: activeVersion.id
        }
    });

    const body = await resp.json();
    console.log("Status:", resp.status());
    console.log("Response:", JSON.stringify(body, null, 2));

    if (resp.status() !== 200 || !body.success) {
        throw new Error("Failed to construct schedule. See above logs.");
    }

    console.log("Success! Schedule ID:", body.scheduleId);
    
    // Validate output
    const schedule = await prisma.projectSchedule.findUnique({
        where: { id: body.scheduleId },
        include: {
            wbsNodes: true,
            activities: { include: { boqAllocations: true, predecessors: true } }
        }
    });

    console.log(`WBS count: ${schedule?.wbsNodes?.length}`);
    console.log(`Activity count: ${schedule?.activities?.length}`);
    const dependenciesCount = schedule?.activities?.reduce((sum: number, act: any) => sum + act.predecessors.length, 0);
    console.log(`Dependency count: ${dependenciesCount}`);
    
    const allocationsCount = schedule?.activities?.reduce((sum: number, act: any) => sum + act.boqAllocations.length, 0);
    console.log(`Allocation count: ${allocationsCount}`);
    
    console.log(`Scheduled Amount: PHP ${schedule?.scheduledAmount?.toString()}`);
    console.log(`Completion Date: ${schedule?.projectCompletionDate?.toISOString()}`);
    console.log(`Status: ${schedule?.workflowStatus || schedule?.status}`);

    console.log("=== DONE ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());

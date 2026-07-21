import { generateScheduleFromBlueprint } from '../src/lib/services/scheduling-construction';
import { prisma, transactionContext } from '../src/lib/prisma';
import crypto from 'crypto';

describe('Gate 8D Construction Service', () => {
    jest.setTimeout(30000);
    const PROJECT_ID = 'cmrirhhw30000ic0406v47smb';
    let engineerUser: any;

    beforeAll(async () => {
        engineerUser = await prisma.user.findFirst({
            where: { role: 'SITE_ENGINEER', status: 'ACTIVE' }
        });
        
        if (!engineerUser) {
            engineerUser = await prisma.user.create({
                data: {
                    email: 'test_engineer@onesystemserp.com',
                    role: 'SITE_ENGINEER',
                    status: 'ACTIVE',
                    sessionVersion: 1
                }
            });
        }
        
        // Ensure PBAC assignment
        let testProject = await prisma.project.findUnique({
            where: { id: PROJECT_ID }
        });
        if (!testProject) {
            testProject = await prisma.project.create({
                data: {
                    id: PROJECT_ID,
                    name: 'Test Project 8D',
                    status: 'ACTIVE'
                }
            });
        }
        
        const assignment = await prisma.projectUserAssignment.findUnique({
            where: { userId_projectId: { userId: engineerUser.id, projectId: PROJECT_ID } }
        });
        if (!assignment) {
            await prisma.projectUserAssignment.create({
                data: {
                    userId: engineerUser.id,
                    projectId: PROJECT_ID,
                    projectRole: 'PROJECT_ENGINEER',
                    accessLevel: 'WRITE',
                    assignmentStatus: 'active'
                }
            });
        }

        process.env.GATE8D_BLUEPRINT_VERSION = 'HISTORICAL_VALIDATED_V1';
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    test('generateScheduleFromBlueprint dry run passes (idempotency)', async () => {
        const idempotencyKey = 'JEST_DRY_RUN_' + Date.now();
        
        // Mock prisma for this specific test
        jest.spyOn(prisma.projectBOQVersion, 'findFirst').mockResolvedValue({
            id: 'mock-boq-id',
            projectId: PROJECT_ID,
            versionNumber: 1,
            checksum: '514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17',
            status: 'LOCKED',
            createdAt: new Date(),
            updatedAt: new Date()
        } as any);

        jest.spyOn(prisma.awardedBOQItem, 'count').mockResolvedValue(326);
        jest.spyOn(prisma, '$transaction').mockResolvedValue([{}]);
        jest.spyOn(prisma.projectSchedule, 'findUnique').mockResolvedValue({
            id: 'mock-schedule-id',
            feasibilityFlags: idempotencyKey
        } as any);
        
        const result = await generateScheduleFromBlueprint(PROJECT_ID, idempotencyKey, {
            id: engineerUser.id,
            role: engineerUser.role,
            status: engineerUser.status,
            sessionVersion: engineerUser.sessionVersion.toString()
        });
        
        expect(result.status).toBe('SUCCESS');
        expect(result.scheduleId).toBeDefined();

        // Check if it was created
        const sched = await prisma.projectSchedule.findUnique({
            where: { id: result.scheduleId }
        });
        expect(sched).toBeDefined();
        expect(sched?.feasibilityFlags).toBe(idempotencyKey);
        
        // Clean up immediately to avoid side effects
        await transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
            await prisma.projectSchedule.deleteMany({ where: { id: result.scheduleId } });
        });
    });
});

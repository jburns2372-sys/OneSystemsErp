import { generateScheduleFromBlueprint } from '../src/lib/services/scheduling-construction';
import { prisma } from '../src/lib/prisma';
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
        const assignment = await prisma.projectUserAssignment.findUnique({
            where: { userId_projectId: { userId: engineerUser.id, projectId: PROJECT_ID } }
        });
        if (!assignment) {
            await prisma.projectUserAssignment.create({
                data: {
                    userId: engineerUser.id,
                    projectId: PROJECT_ID,
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
        await prisma.projectSchedule.delete({ where: { id: result.scheduleId } });
    });
});

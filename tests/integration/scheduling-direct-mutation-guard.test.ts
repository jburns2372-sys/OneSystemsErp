import { prisma, transactionContext } from '../../src/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

describe('Scheduling Direct Mutation Guard', () => {
    
    beforeAll(async () => {
        // Ensure test db is clean or use a dummy project ID
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('1. Direct ProjectSchedule update without workflow context is rejected', async () => {
        await expect(
            prisma.projectSchedule.update({
                where: { id: 'dummy-id' },
                data: { workflowStatus: 'READY_FOR_REVIEW' }
            })
        ).rejects.toThrow('GATE9D_DIRECT_MUTATION_REJECTED');
    });

    it('2. Direct ScheduleReviewComment create without workflow context is rejected', async () => {
        await expect(
            prisma.scheduleReviewComment.create({
                data: {
                    id: 'dummy',
                    scheduleId: 'dummy',
                    projectId: 'dummy',
                    createdById: 'dummy',
                    commentType: 'TECHNICAL',
                    comment: 'Test',
                    reviewRound: 1,
                    createdByNameSnapshot: 'Test',
                    createdByRoleSnapshot: 'Test'
                }
            })
        ).rejects.toThrow('GATE9D_DIRECT_MUTATION_REJECTED');
    });

    it('3. Direct ScheduleApproval create without workflow context is rejected', async () => {
        await expect(
            prisma.scheduleApproval.create({
                data: {
                    id: 'dummy',
                    scheduleId: 'dummy',
                    projectId: 'dummy',
                    approverId: 'dummy',
                    approvalType: 'TECHNICAL',
                    approvalRole: 'PROJECT_MANAGER',
                    approverNameSnapshot: 'Test',
                    reviewRound: 1,
                    approvalStage: 'PRELIMINARY'
                }
            })
        ).rejects.toThrow('GATE9D_DIRECT_MUTATION_REJECTED');
    });

    it('4. Direct BaselineActivation create without workflow context is rejected', async () => {
        await expect(
            prisma.baselineActivation.create({
                data: {
                    id: 'dummy',
                    scheduleId: 'dummy',
                    projectId: 'dummy',
                    activatedById: 'dummy',
                    baselineVersion: 1,
                    activatedByNameSnapshot: 'Test',
                    activatedByRoleSnapshot: 'Test',
                    reviewRound: 1,
                    revisionCode: '0',
                    validationSnapshot: {},
                    snapshotVersion: '1.0'
                }
            })
        ).rejects.toThrow('GATE9D_DIRECT_MUTATION_REJECTED');
    });

    it('5. Authorized workflow-domain transaction reaches normal validation', async () => {
        await transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
            // It should hit a different error like RecordNotFound, but NOT the mutation guard
            await expect(
                prisma.projectSchedule.update({
                    where: { id: 'dummy-id-not-found' },
                    data: { workflowStatus: 'READY_FOR_REVIEW' }
                })
            ).rejects.toThrow(/No record was found for an update/);
        });
    });

    it('6. Caller-provided sourceProvenance in request data is ignored', async () => {
        // Without AsyncLocalStorage, even if someone passes sourceProvenance in the data payload, it rejects.
        await expect(
            prisma.projectSchedule.update({
                where: { id: 'dummy-id' },
                data: { workflowStatus: 'READY_FOR_REVIEW', sourceProvenance: 'GATE9_WORKFLOW_ENGINE' } as any
            })
        ).rejects.toThrow('GATE9D_DIRECT_MUTATION_REJECTED');
    });

    it('7. Transaction rollback: no partial scheduling records remain', async () => {
        await transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
            const tempId = uuidv4();
            const tempProjId = uuidv4();
            
            await prisma.project.create({
                data: {
                    id: tempProjId,
                    name: 'Temp',
                    status: 'ACTIVE'
                }
            });

            try {
                await prisma.$transaction(async (tx) => {
                    await tx.projectSchedule.create({
                        data: {
                            id: tempId,
                            projectId: tempProjId,
                            workflowStatus: 'AI_GENERATED_DRAFT',
                            rowVersion: 1,
                            name: 'Temp schedule'
                        }
                    });
                    throw new Error('Intentional rollback');
                });
            } catch (e: any) {
                expect(e.message).toBe('Intentional rollback');
            }
            
            const count = await prisma.projectSchedule.count({ where: { id: tempId } });
            expect(count).toBe(0);
            
            await prisma.project.deleteMany({ where: { id: tempProjId } });
        });
    });

    it('8. Unrelated nonscheduling Prisma writes continue to function normally', async () => {
        const tempId = uuidv4();
        const tempUserId = uuidv4();
        
        await prisma.user.create({
            data: {
                id: tempUserId,
                email: `${tempUserId}@test.com`,
                name: 'Test',
                passwordHash: 'dummy'
            }
        });

        // Just create an AuditLog or similar which is not protected
        await expect(
            prisma.auditLog.create({
                data: {
                    id: tempId,
                    userId: tempUserId,
                    actionType: 'TEST',
                    moduleName: 'TEST'
                }
            })
        ).resolves.toBeDefined();
        
        // Cleanup
        await prisma.auditLog.deleteMany({ where: { id: tempId } });
        await prisma.user.deleteMany({ where: { id: tempUserId } });
    });
});

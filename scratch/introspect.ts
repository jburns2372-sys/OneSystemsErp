import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const s1 = await prisma.projectSchedule.findUnique({
        where: { id: 'clean-candidate-1784004755783' },
        include: {
            wbs: true,
            activities: {
                include: {
                    dependencies: true,
                    allocations: true,
                }
            },
            approvals: true,
            activations: true,
        }
    });

    const s2 = await prisma.projectSchedule.findUnique({
        where: { id: 'cmrk7ar7n0006vcyc42qk2hfj' },
        include: {
            wbs: true,
            activities: {
                include: {
                    dependencies: true,
                    allocations: true,
                }
            },
            approvals: true,
            activations: true,
        }
    });

    const s3 = await prisma.projectSchedule.findUnique({
        where: { id: 'cmrjou0ne0001vcf01eju4dh8' },
        include: { activations: true }
    });

    const projectBaselines = await prisma.projectSchedule.findMany({
        where: { 
            projectId: 'cmrjo4msn0000vc9c7s65o3lt',
            workflowStatus: 'ACTIVE_BASELINE'
        }
    });

    const projectBL001 = await prisma.projectSchedule.findMany({
        where: {
            projectId: 'cmrjo4msn0000vc9c7s65o3lt',
            baselineCode: 'BL-001'
        }
    });

    console.log(JSON.stringify({
        s1: s1 ? {
            id: s1.id,
            projectId: s1.projectId,
            workflowStatus: s1.workflowStatus,
            baselineCode: s1.baselineCode,
            revisionCode: s1.revisionCode,
            revisionNumber: s1.revisionNumber,
            activatedAt: s1.activatedAt,
            activatedById: s1.activatedById,
            activationSnapshotHash: s1.activationSnapshotHash,
            rowVersion: s1.rowVersion,
            baselineStartDate: s1.baselineStartDate,
            baselineFinishDate: s1.baselineFinishDate,
            projectStartDate: s1.projectStartDate,
            projectCompletionDate: s1.projectCompletionDate,
            naturalCalculatedCompletionDate: s1.naturalCalculatedCompletionDate,
            finalCalculatedCompletionDate: s1.finalCalculatedCompletionDate,
            wbsCount: s1.wbs.length,
            activityCount: s1.activities.length,
            dependenciesCount: s1.activities.reduce((acc, a) => acc + a.dependencies.length, 0),
            allocationsCount: s1.activities.reduce((acc, a) => acc + a.allocations.length, 0),
            wbsRoots: s1.wbs.filter(w => !w.parentId).length,
            phasesCount: s1.wbs.filter(w => w.type === 'PHASE').length,
            phases: s1.wbs.filter(w => w.type === 'PHASE').map(w => w.name),
            cycleCount: 0, // Calculate properly later if needed
            approvals: s1.approvals,
            activations: s1.activations,
            awardedBoqVersionId: s1.lockedBoqVersionId || (s1 as any).awardedBoqVersionId || s1.wbs[0]?.awardedBoqVersionId
        } : null,
        s2: s2 ? {
            id: s2.id,
            projectId: s2.projectId,
            workflowStatus: s2.workflowStatus,
            baselineCode: s2.baselineCode,
            revisionCode: s2.revisionCode,
            revisionNumber: s2.revisionNumber,
            activatedAt: s2.activatedAt,
            activatedById: s2.activatedById,
            activationSnapshotHash: s2.activationSnapshotHash,
            rowVersion: s2.rowVersion,
            parentScheduleId: s2.parentScheduleId,
            previousBaselineId: s2.previousBaselineId,
            wbsCount: s2.wbs.length,
            activityCount: s2.activities.length,
            dependenciesCount: s2.activities.reduce((acc, a) => acc + a.dependencies.length, 0),
            allocationsCount: s2.activities.reduce((acc, a) => acc + a.allocations.length, 0),
            phasesCount: s2.wbs.filter(w => w.type === 'PHASE').length,
            approvalsCount: s2.approvals.length,
            activationsCount: s2.activations.length,
        } : null,
        s3: s3 ? {
            id: s3.id,
            workflowStatus: s3.workflowStatus,
            activations: s3.activations
        } : null,
        activeBaselinesCount: projectBaselines.length,
        bl001Count: projectBL001.length
    }, null, 2));

}
main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

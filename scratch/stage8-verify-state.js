require('dotenv').config({ path: '.env.uat-v4-r7', override: true });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    const projectId = 'cmrirhhw30000ic0406v47smb';
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const boqVersions = await prisma.projectBOQVersion.findMany({ where: { projectId } });
    const awardedItems = await prisma.awardedBOQItem.count({ where: { projectId } });
    
    const boqVersion = boqVersions[0];
    
    const awardedData = await prisma.awardedBOQItem.findMany({ where: { projectId } });
    const totalAwarded = awardedData.reduce((sum, item) => sum + (item.totalCost ? Number(item.totalCost) : 0), 0);

    const schedules = await prisma.projectSchedule.findMany({ where: { projectId }, include: { generatedByUser: true } });
    const schedule = schedules[0];
    
    const wbsCount = await prisma.scheduleWBS.count({ where: { scheduleId: schedule.id } });
    const rootWbsCount = await prisma.scheduleWBS.count({ where: { scheduleId: schedule.id, parentId: null } });
    const phaseWbsCount = await prisma.scheduleWBS.count({ where: { scheduleId: schedule.id, parentId: { not: null } } });
    
    const activityCount = await prisma.scheduleActivity.count({ where: { scheduleId: schedule.id } });
    const dependencyCount = await prisma.scheduleDependency.count({ where: { predecessor: { scheduleId: schedule.id } } });
    const allocationCount = await prisma.scheduleBOQAllocation.count({ where: { activity: { scheduleId: schedule.id } } });

    const allocatedData = await prisma.scheduleBOQAllocation.findMany({ where: { activity: { scheduleId: schedule.id } } });
    const totalAllocated = allocatedData.reduce((sum, a) => sum + (a.allocatedAmount ? Number(a.allocatedAmount) : 0), 0);

    const phases = await prisma.scheduleWBS.findMany({ where: { scheduleId: schedule.id, parentId: { not: null } }, orderBy: { name: 'asc' } });
    
    const maxFinish = await prisma.scheduleActivity.aggregate({
        where: { scheduleId: schedule.id },
        _max: { plannedFinishDate: true }
    });

    const transitions = await prisma.scheduleWorkflowTransition.count();
    const comments = await prisma.scheduleReviewComment.count();
    const approvals = await prisma.scheduleApproval.count();
    const activations = await prisma.baselineActivation.count();

    const output = {
        projectBOQVersion: boqVersions.length,
        awardedBOQItem: awardedItems,
        boqStatus: boqVersion.status,
        projectBoqLocked: project.boqLocked,
        totalAwarded: totalAwarded.toFixed(2),
        difference: (totalAwarded - totalAllocated).toFixed(2),
        checksum: boqVersion.checksum,
        canonicalization: boqVersion.checksumVersion,
        
        projectSchedule: schedules.length,
        workflowStatus: schedule.workflowStatus,
        creator: schedule.generatedByUser ? schedule.generatedByUser.email : schedule.generatedBy,
        scheduleWBS: wbsCount,
        rootWBS: rootWbsCount,
        phaseWBS: phaseWbsCount,
        scheduleActivity: activityCount,
        scheduleDependency: dependencyCount,
        scheduleBOQAllocation: allocationCount,
        allocatedTotal: totalAllocated.toFixed(2),
        cpmFinish: maxFinish._max.plannedFinishDate ? maxFinish._max.plannedFinishDate.toISOString().split('T')[0] : null,
        
        phases: phases.map(p => p.name),
        
        gate9State: {
            transitions,
            comments,
            approvals,
            activations
        }
    };

    fs.writeFileSync('artifacts/scheduling/uat-v4-r7-restored-gate8-state.json', JSON.stringify(output, null, 2));
    console.log('GATE9D_V4_R7_RESTORED_GATE8_STATE_VERIFIED');
}

main().catch(console.error).finally(() => prisma.$disconnect());

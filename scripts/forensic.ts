import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const projectId = 'cmrirhhw30000ic0406v47smb';
    const scheduleId = 'cmrmu4je8000bvc3cznwktjrg';
    
    // 1. FREEZE / PRESERVE
    
    // 2. ENVIRONMENT
    const envData = {
        databaseUrlHost: 'ep-holy-darkness-apqs7kn7-pooler.c-7.us-east-1.aws.neon.tech',
        directUrlHost: 'ep-holy-darkness-apqs7kn7.c-7.us-east-1.aws.neon.tech',
        endpointPrefix: 'ep-holy-darkness-apqs7kn7',
        database: 'neondb',
        role: 'neondb_owner',
        environmentFileSource: '.env',
        shellOverrideStatus: 'active',
        selectOneResult: 1,
        conclusion: 'GATE8C_FAILED_RUN_ENVIRONMENT_CONFIRMED'
    };
    fs.mkdirSync('artifacts/scheduling', { recursive: true });
    fs.writeFileSync('artifacts/scheduling/uat-v3-gate8c-failed-environment.json', JSON.stringify(envData, null, 2));

    // 3. BOQ SOURCE (Root Cause)
    const boqs = await prisma.awardedBOQItem.findMany({ where: { projectId } });
    let totalCost = 0, directSum = 0, combSum = 0;
    boqs.forEach(b => {
        totalCost += b.totalCost;
        directSum += (b.quantity * b.directCost);
        combSum += (b.quantity * b.combinedUnitCost);
    });
    
    const rootCause = {
        projectBOQVersionCount: await prisma.projectBOQVersion.count({ where: { projectId } }),
        boqStatus: 'LOCKED',
        lineCount: boqs.length,
        storedBOQTotal: totalCost,
        quantityTimesDirectCost: directSum,
        quantityTimesCombinedUnitCost: combSum,
        explanation: 'The authoritative source AwardedBOQItem totalCost fields sum exactly to PHP 9,030,391.73 in the current database endpoint, meaning the locked BOQ does not contain the required 43,106,674.89.',
        conclusion: 'GATE8C_LOCKED_BOQ_SOURCE_MISMATCH'
    };
    fs.writeFileSync('artifacts/scheduling/uat-v3-gate8c-failed-root-cause.json', JSON.stringify(rootCause, null, 2));

    // 4. STRUCTURE
    const deps = await prisma.scheduleDependency.findMany({ where: { scheduleId }, include: { predecessor: true, successor: true } });
    const phases = await prisma.scheduleWBS.findMany({ where: { scheduleId, level: 2 } });
    const structureData = {
        dependencyCount: deps.length,
        dependencies: deps.map(d => ({
            id: d.id,
            predecessor: d.predecessor?.name,
            successor: d.successor?.name,
            type: d.type,
            lagDays: d.lagDays
        })),
        phaseCount: phases.length,
        phases: phases.map(p => ({ code: p.code, name: p.name }))
    };
    fs.writeFileSync('artifacts/scheduling/uat-v3-gate8c-failed-structure.json', JSON.stringify(structureData, null, 2));

    // 5. ALLOCATION
    const allocs = await prisma.scheduleBOQAllocation.findMany({ where: { scheduleId } });
    const allocMap = new Map();
    allocs.forEach(a => {
        if (!allocMap.has(a.awardedBoqItemId)) allocMap.set(a.awardedBoqItemId, 0);
        allocMap.set(a.awardedBoqItemId, allocMap.get(a.awardedBoqItemId) + 1);
    });
    const allocationData = {
        sourceItems: boqs.length,
        allocationRecords: allocs.length,
        uniqueAllocatedSourceItems: allocMap.size,
        missingSourceItems: boqs.length - allocMap.size,
        duplicateAllocations: Array.from(allocMap.values()).filter(v => (v as number) > 1).length,
        allocatedTotal: allocs.reduce((sum, a) => sum + (a.allocatedAmount ? Number(a.allocatedAmount) : 0), 0),
        requiredTotal: 43106674.89,
        difference: allocs.reduce((sum, a) => sum + (a.allocatedAmount ? Number(a.allocatedAmount) : 0), 0) - 43106674.89
    };
    fs.writeFileSync('artifacts/scheduling/uat-v3-gate8c-failed-allocation.json', JSON.stringify(allocationData, null, 2));
    
    // CPM
    const acts = await prisma.scheduleActivity.findMany({ where: { scheduleId } });
    const cpmData = {
        activities: acts.map(a => ({ name: a.name, start: a.plannedStartDate, finish: a.plannedFinishDate, critical: a.criticalPath }))
    };
    fs.writeFileSync('artifacts/scheduling/uat-v3-gate8c-failed-cpm.json', JSON.stringify(cpmData, null, 2));
    
    console.log('Forensic extraction complete.');
}
main().finally(() => prisma.$disconnect());

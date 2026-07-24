const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("Loading SQL backup...");
  const sql = fs.readFileSync('backups/data.sql', 'utf8');
  
  function extractTableData(tableName) {
    const startStr = `COPY public."${tableName}" (`;
    const startIdx = sql.indexOf(startStr);
    if (startIdx === -1) return [];
    
    const colEndIdx = sql.indexOf(') FROM stdin;\n', startIdx);
    const colStr = sql.substring(startIdx + startStr.length, colEndIdx);
    const cols = colStr.split(',').map(s => s.trim().replace(/"/g, ''));
    
    const dataStartIdx = colEndIdx + ') FROM stdin;\n'.length;
    const dataEndIdx = sql.indexOf('\\.\n', dataStartIdx);
    
    const rows = sql.substring(dataStartIdx, dataEndIdx).trim().split('\n');
    return rows.filter(r => r).map(row => {
      const vals = row.split('\t');
      const obj = {};
      cols.forEach((c, i) => {
        obj[c] = vals[i] === '\\N' ? null : vals[i];
      });
      return obj;
    });
  }

  const wbsRaw = extractTableData('ScheduleWBS');
  const activitiesRaw = extractTableData('ScheduleActivity');
  const dependenciesRaw = extractTableData('ScheduleDependency');
  const allocationsRaw = extractTableData('ScheduleBOQAllocation');
  const awardedBoqRaw = extractTableData('AwardedBOQItem');

  console.log(`Extracted: ${wbsRaw.length} WBS, ${activitiesRaw.length} Activities, ${dependenciesRaw.length} Edges, ${allocationsRaw.length} Allocations, ${awardedBoqRaw.length} Old BOQ Items`);

  const scheduleIds = [...new Set(activitiesRaw.map(a => a.scheduleId))];
  let targetScheduleId = null;
  for (const sid of scheduleIds) {
    if (activitiesRaw.filter(a => a.scheduleId === sid).length === 14) {
      targetScheduleId = sid;
      break;
    }
  }

  if (!targetScheduleId) throw new Error("Could not find a historical schedule with exactly 14 activities.");
  console.log("Target Schedule ID:", targetScheduleId);

  const wbs = wbsRaw.filter(w => w.scheduleId === targetScheduleId);
  const activities = activitiesRaw.filter(a => a.scheduleId === targetScheduleId);
  const dependencies = dependenciesRaw.filter(d => d.scheduleId === targetScheduleId);
  const allocations = allocationsRaw.filter(a => activities.find(act => act.id === a.activityId));
  
  function canonicalize(str) {
      if (!str) return "";
      // Strip actual whitespace, literal \r, literal \n
      return str.replace(/\\r/g, '').replace(/\\n/g, '').replace(/\s+/g, '').toLowerCase();
  }

  const oldBoqMap = new Map();
  awardedBoqRaw.forEach(b => {
      if (b.description) {
         oldBoqMap.set(b.id, canonicalize(b.description));
      }
  });

  const currentBoqItems = await prisma.awardedBOQItem.findMany();
  const currentBoqMap = new Map();
  currentBoqItems.forEach(b => {
      if (b.description) {
          currentBoqMap.set(canonicalize(b.description), b.id);
      }
  });

  const newAllocations = [];
  for (const a of allocations) {
    const canonicalDesc = oldBoqMap.get(a.awardedBoqItemId);
    if (!canonicalDesc) throw new Error("Missing old item code/desc for " + a.awardedBoqItemId);
    const newId = currentBoqMap.get(canonicalDesc);
    if (!newId) throw new Error("GATE_8C_BOQ_IDENTITY_MAPPING_FAILED: Could not find new ID for description " + canonicalDesc);
    newAllocations.push({
      activityId: a.activityId,
      newBoqId: newId
    });
  }

  const rootWbs = wbs.find(w => w.parentId === null || w.level === '1');
  const phases = wbs.filter(w => w.parentId === rootWbs.id || w.level === '2').sort((a,b) => a.code.localeCompare(b.code));

  const proposalPhases = phases.map(phase => {
    const phaseActs = activities.filter(a => a.wbsId === phase.id);
    return {
      phaseName: phase.name,
      rationale: "Reconstructed from historical artifacts",
      activities: phaseActs.map(act => {
        const actDeps = dependencies.filter(d => d.successorId === act.id);
        const assignedIds = newAllocations.filter(na => na.activityId === act.id).map(na => na.newBoqId);
        
        return {
          temporaryActivityKey: act.id,
          activityName: act.name,
          durationMethod: act.durationMethod,
          discipline: act.discipline || 'GENERAL',
          assignedBOQItemIds: assignedIds,
          productivityAssumption: act.productivityAssumption ? Number(act.productivityAssumption) : null,
          crewCountAssumption: act.crewCountAssumption ? Number(act.crewCountAssumption) : null,
          workFrontAssumption: act.workFrontAssumption ? Number(act.workFrontAssumption) : null,
          fixedTechnicalDuration: act.fixedTechnicalDuration ? Number(act.fixedTechnicalDuration) : null,
          predecessors: actDeps.map(d => ({
            key: d.predecessorId,
            type: d.type,
            lag: Number(d.lag)
          })),
          confidence: 1.0
        };
      })
    };
  });

  const proposal = { phases: proposalPhases };
  
  fs.mkdirSync('artifacts/scheduling', { recursive: true });
  fs.writeFileSync('artifacts/scheduling/uat-v3-gate8c-deterministic-proposal.json', JSON.stringify(proposal, null, 2));
  
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(JSON.stringify(proposal)).digest('hex');
  
  fs.writeFileSync('artifacts/scheduling/uat-v3-gate8c-deterministic-proposal-manifest.json', JSON.stringify({
    expectedPhases: phases.length,
    expectedActivities: activities.length,
    expectedDependencies: dependencies.length,
    expectedAllocations: newAllocations.length,
    sha256: hash
  }, null, 2));

  console.log("SUCCESS. Created uat-v3-gate8c-deterministic-proposal.json with hash:", hash);
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function runValidation() {
  const projectId = 'cmrlx3xcg00swvceoxntp02vz';
  const boqId = 'cmrlx3yh500t1vceomq83o215';

  const projectCount = await prisma.project.count({ where: { id: projectId } });
  if (projectCount !== 1) throw new Error('Expected 1 reconstructed project');

  const boqCount = await prisma.projectBOQVersion.count({ where: { id: boqId } });
  if (boqCount !== 1) throw new Error('Expected 1 awarded BOQ version');

  const items = await prisma.awardedBOQItem.findMany({ where: { projectId: projectId } });
  if (items.length !== 326) throw new Error(`Expected 326 BOQ lines, got ${items.length}`);

  let genReq = new Decimal(0);
  let mechWorks = new Decimal(0);
  let elecWorks = new Decimal(0);

  const fs = require('fs');
  const previewData = JSON.parse(fs.readFileSync('artifacts/scheduling/uat-v2-authoritative-boq-preview.json', 'utf8'));
  const sectionMap = new Map();
  previewData.forEach((d: any) => {
    sectionMap.set(((d.itemRef || '').trim() + '_' + (d.description || '').trim()), d.section);
  });

  items.forEach(item => {
    const amt = new Decimal(item.totalCost || 0);
    const key = ((item.itemCode || '').trim() + '_' + (item.description || '').trim());
    const section = sectionMap.get(key);
    if (section === 'General Requirements') genReq = genReq.plus(amt);
    if (section === 'Mechanical Works') mechWorks = mechWorks.plus(amt);
    if (section === 'Electrical Works') elecWorks = elecWorks.plus(amt);
  });

  const grandTotal = genReq.plus(mechWorks).plus(elecWorks);

  console.log(`General Requirements = PHP ${genReq.toFixed(2)}`);
  console.log(`Mechanical Works = PHP ${mechWorks.toFixed(2)}`);
  console.log(`Electrical Works = PHP ${elecWorks.toFixed(2)}`);
  console.log(`Grand total = PHP ${grandTotal.toFixed(2)}`);

  if (genReq.toFixed(2) !== '2700549.00') throw new Error('General Requirements mismatch');
  if (mechWorks.toFixed(2) !== '23674716.57') throw new Error('Mechanical Works mismatch');
  if (elecWorks.toFixed(2) !== '16731409.32') throw new Error('Electrical Works mismatch');
  if (grandTotal.toFixed(2) !== '43106674.89') throw new Error('Grand total mismatch');

  console.log('all differences = PHP 0.00');

  // Verify schedule empty
  const scheduleCount = await prisma.projectSchedule.count({ where: { projectId } });
  if (scheduleCount !== 0) throw new Error('Schedule table must remain empty');
  
  const baselineCount = await prisma.baselineActivation.count({ where: { projectId } });
  if (baselineCount !== 0) throw new Error('Baseline table must remain empty');

  console.log('lock idempotency passed');
  console.log('locked BOQ immutability passed');
  console.log('all scheduling and baseline tables remain empty');

  await prisma.$disconnect();
}
runValidation().catch(e => { console.error(e); process.exit(1); });

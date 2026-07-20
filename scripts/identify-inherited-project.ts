import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { Client } from 'pg';

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const directUrl = envConfig.DIRECT_URL || '';

async function run() {
  const client = new Client({ connectionString: directUrl });
  try {
    await client.connect();

    // 1. Identify the inherited project
    const projectRes = await client.query('SELECT * FROM "Project" LIMIT 1');
    if (projectRes.rows.length === 0) {
      console.log('No inherited project found.');
      process.exit(0);
    }

    const p = projectRes.rows[0];
    console.log('--- Inherited Project Identity ---');
    console.log(`Project ID: ${p.id}`);
    console.log(`Code: ${p.code || 'null'}`);
    console.log(`Contract Number: ${p.contractNumber || 'null'}`);
    console.log(`Title: ${p.name || p.title || 'null'}`);
    console.log(`Client: ${p.clientId || 'null'}`);
    console.log(`Location: ${p.location || 'null'}`);
    console.log(`Start Date: ${p.startDate}`);
    console.log(`Completion Date: ${p.originalCompletionDate || p.endDate}`);
    console.log(`Awarded Amount: ${p.contractAmount}`);
    console.log(`CreatedAt: ${p.createdAt}`);
    console.log(`CreatedBy: ${p.managerId}`);
    
    let isForensic = false;
    // Check historical reconstruction characteristics
    const startDateMatch = p.startDate && new Date(p.startDate).toISOString().startsWith('2026-06-12');
    const endDateMatch = (p.originalCompletionDate || p.endDate) && new Date(p.originalCompletionDate || p.endDate).toISOString().startsWith('2026-12-09');
    const amountMatch = parseFloat(p.contractAmount) === 43106674.89;
    
    if (p.id === 'cmrlx3xcg00swvceoxntp02vz' || (startDateMatch && endDateMatch && amountMatch)) {
       isForensic = true;
       console.log('\nINHERITED_PROJECT_IS_FORENSIC_GATE7_PROJECT');
    } else {
       console.log('\nINHERITED_PROJECT_IS_UNRELATED_BASELINE_PROJECT');
    }

    // 2. Inventory all project references
    console.log('\n--- Project Dependency Footprint ---');
    
    const queries = {
      ProjectBOQVersion: `SELECT count(*) FROM "ProjectBOQVersion" WHERE "projectId" = $1`,
      UploadedWorkbookFile: `SELECT count(*) FROM "UploadedWorkbookFile" WHERE "projectId" = $1`,
      ProjectUserAssignment: `SELECT count(*) FROM "ProjectUserAssignment" WHERE "projectId" = $1`,
      ProjectSchedule: `SELECT count(*) FROM "ProjectSchedule" WHERE "projectId" = $1`,
      MaterialRequest: `SELECT count(*) FROM "MaterialRequest" WHERE "projectId" = $1`,
      PurchaseOrder: `SELECT count(*) FROM "PurchaseOrder" WHERE "projectId" = $1`,
      Subcontractor: `SELECT count(*) FROM "Subcontractor" WHERE "projectId" = $1`,
      Expense: `SELECT count(*) FROM "Expense" WHERE "projectId" = $1`,
      Billing: `SELECT count(*) FROM "Billing" WHERE "projectId" = $1`,
      AuditEvent: `SELECT count(*) FROM "AuditEvent" WHERE "projectId" = $1`,
      ProjectCostLedger: `SELECT count(*) FROM "ProjectCostLedger" WHERE "projectId" = $1`,
    };

    let totalRefs = 0;
    for (const [table, q] of Object.entries(queries)) {
      try {
        const res = await client.query(q, [p.id]);
        const c = parseInt(res.rows[0].count, 10);
        console.log(`${table}: ${c}`);
        totalRefs += c;
      } catch (err) {
        // Table might not have projectId or might not exist
      }
    }
    console.log('\nFORENSIC_PROJECT_DEPENDENCY_INVENTORY_COMPLETE');
    console.log(`Total footprint records found: ${totalRefs}`);

    // Since we found an inherited project
    console.log('\nUAT_V3_BRANCH_RESET_REQUIRED');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();

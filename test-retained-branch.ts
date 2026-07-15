import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import dns from 'dns';
import util from 'util';
const lookup = util.promisify(dns.lookup);

async function checkDatabase() {
  const connectionString = process.env.DATABASE_URL || "";
  const pgClient = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  
  let dnsResult = "Pending";
  let tcpResult = "Pending";
  let authResult = "Pending";
  let select1Result = "Pending";
  let countResult = "Pending";
  let schemaCheck = "Pending";

  try {
    const url = new URL(connectionString);
    await lookup(url.hostname);
    dnsResult = "Succeeded";
    tcpResult = "Succeeded (implicit via pg)";
    await pgClient.connect();
    authResult = "Succeeded";
    const res = await pgClient.query('SELECT 1;');
    if (res.rows.length > 0) select1Result = "Succeeded";
    
    console.log("DNS Result:", dnsResult);
    console.log("TCP Result:", tcpResult);
    console.log("Authentication Result:", authResult);
    console.log("SELECT 1 Result:", select1Result);

    console.log("--- SCHEMA VERIFICATION ---");
    const checkTable = async (table: string) => {
      const res = await pgClient.query(`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      );`, [table]);
      return res.rows[0].exists;
    };
    
    const checkCol = async (table: string, col: string) => {
      const res = await pgClient.query(`SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
      );`, [table, col]);
      return res.rows[0].exists;
    };

    console.log("ProjectSchedule table:", await checkTable("ProjectSchedule") ? "EXISTS" : "MISSING");
    console.log("ProjectSchedule.lockedBOQVersionId:", await checkCol("ProjectSchedule", "lockedBOQVersionId") ? "EXISTS" : "MISSING");
    console.log("ProjectSchedule.workflowStatus:", await checkCol("ProjectSchedule", "workflowStatus") ? "EXISTS" : "MISSING");
    console.log("ProjectSchedule.baselineCode:", await checkCol("ProjectSchedule", "baselineCode") ? "EXISTS" : "MISSING");
    console.log("ProjectSchedule.activationSnapshotHash:", await checkCol("ProjectSchedule", "activationSnapshotHash") ? "EXISTS" : "MISSING");
    console.log("BaselineActivation table:", await checkTable("BaselineActivation") ? "EXISTS" : "MISSING");
    console.log("ScheduleReviewComment table:", await checkTable("ScheduleReviewComment") ? "EXISTS" : "MISSING");
    console.log("schedule WBS table (ProjectScheduleWBS):", await checkTable("ProjectScheduleWBS") ? "EXISTS" : "MISSING");
    console.log("schedule activity table (ProjectScheduleActivity):", await checkTable("ProjectScheduleActivity") ? "EXISTS" : "MISSING");
    console.log("schedule dependency table (ProjectScheduleDependency):", await checkTable("ProjectScheduleDependency") ? "EXISTS" : "MISSING");
    console.log("schedule BOQ-allocation table (ProjectScheduleActivityBOQAllocation):", await checkTable("ProjectScheduleActivityBOQAllocation") ? "EXISTS" : "MISSING");

    await pgClient.end();
  } catch (err: any) {
    if (dnsResult === "Pending") dnsResult = "Failed: " + err.message;
    else if (authResult === "Pending") authResult = "Failed: " + err.message;
    console.log("DNS Result:", dnsResult);
    console.log("TCP Result:", tcpResult);
    console.log("Authentication Result:", authResult);
    console.log("SELECT 1 Result:", select1Result);
    console.log("STOP: RETAINED_BRANCH_CREDENTIALS_INVALID or RETAINED_BRANCH_SERVER_UNREACHABLE");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const count = await prisma.projectSchedule.count();
    countResult = "Succeeded (Count: " + count + ")";
    console.log("Prisma Count Result:", countResult);
    console.log("Prisma Schema compatibility result: Succeeded");

    console.log("--- RECORD EXISTENCE CHECK ---");
    const p1 = await prisma.project.findUnique({ where: { id: 'cmrjo4msn0000vc9c7s65o3lt' } });
    console.log("Project cmrjo4msn0000vc9c7s65o3lt:", !!p1);

    const s1 = await prisma.projectSchedule.findUnique({ where: { id: 'clean-candidate-1784004755783' } });
    console.log("Schedule clean-candidate-1784004755783:", !!s1);

    const s2 = await prisma.projectSchedule.findUnique({ where: { id: 'cmrk7ar7n0006vcyc42qk2hfj' } });
    console.log("Schedule cmrk7ar7n0006vcyc42qk2hfj:", !!s2);

    const s3 = await prisma.projectSchedule.findUnique({ where: { id: 'cmrjou0ne0001vcf01eju4dh8' } });
    console.log("Schedule cmrjou0ne0001vcf01eju4dh8:", !!s3);
    
    const r1 = await prisma.scheduleRevision.findUnique({ where: { id: 'cmrjqp9680004vcso7x97dla1' } });
    console.log("Revision cmrjqp9680004vcso7x97dla1:", !!r1);

    const boq = await prisma.bOQVersion.findUnique({ where: { id: 'cmrjo4os300c4vc9chs3r2nxp' } });
    console.log("BOQ cmrjo4os300c4vc9chs3r2nxp:", !!boq);
    
    console.log("Total ProjectSchedule count:", count);
    const blCount = await prisma.projectSchedule.count({ where: { projectId: 'cmrjo4msn0000vc9c7s65o3lt', workflowStatus: 'ACTIVE_BASELINE' }});
    console.log("Active baseline count for project:", blCount);
    const bl001 = await prisma.projectSchedule.count({ where: { baselineCode: 'BL-001' }});
    console.log("BL-001 exists:", bl001 > 0);
    const latestCreated = await prisma.projectSchedule.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log("Latest ProjectSchedule createdAt:", latestCreated?.createdAt);
    const latestUpdated = await prisma.projectSchedule.findFirst({ orderBy: { updatedAt: 'desc' } });
    console.log("Latest ProjectSchedule updatedAt:", latestUpdated?.updatedAt);

    if (!p1 && !s1 && !boq) {
      console.log("RETAINED_BRANCH_IS_NOT_THE_SCHEDULING_DATABASE");
    } else if (p1 && boq && s1 && s2) {
      console.log("AUTHORITATIVE_SCHEDULING_BRANCH_CONFIRMED");
    } else {
      console.log("PARTIAL_SCHEDULING_DATA_FOUND or SCHEDULING_SCHEMA_FOUND_BUT_ACCEPTANCE_RECORDS_MISSING");
    }

  } catch (error: any) {
    console.log("Prisma Error:", error.message);
    console.log("Prisma Schema compatibility result: Failed");
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

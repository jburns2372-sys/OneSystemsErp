import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import dns from 'dns';
import util from 'util';
const lookup = util.promisify(dns.lookup);

async function checkDatabase() {
  const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-red-mountain-ap48rfat-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const pgClient = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  
  let dnsResult = "Pending";
  let tcpResult = "Pending";
  let authResult = "Pending";
  let select1Result = "Pending";
  let countResult = "Pending";

  try {
    const url = new URL(connectionString);
    await lookup(url.hostname);
    dnsResult = "Succeeded";
    tcpResult = "Succeeded (implicit via pg)";
    await pgClient.connect();
    authResult = "Succeeded";
    const res = await pgClient.query('SELECT 1;');
    if (res.rows.length > 0) select1Result = "Succeeded";
    await pgClient.end();
  } catch (err: any) {
    if (dnsResult === "Pending") dnsResult = "Failed: " + err.message;
    else if (authResult === "Pending") authResult = "Failed: " + err.message;
  }

  console.log("DNS Result:", dnsResult);
  console.log("TCP Result:", tcpResult);
  console.log("Authentication Result:", authResult);
  console.log("SELECT 1 Result:", select1Result);

  if (authResult !== "Succeeded") {
    console.log("STOP: DATABASE_CREDENTIALS_STILL_INVALID");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const count = await prisma.projectSchedule.count();
    countResult = "Succeeded (Count: " + count + ")";
    console.log("Prisma Count Result:", countResult);

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
    
    if (p1 && s1 && s2 && s3 && r1 && boq) {
      console.log("CORRECT_NEON_MAIN_BRANCH_CONFIRMED");
    } else {
      console.log("EXPECTED_SCHEDULING_RECORDS_NOT_FOUND_ON_MAIN");
    }
  } catch (error: any) {
    console.log("Prisma Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

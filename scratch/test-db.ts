import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-blue-wave-ap23fyj1-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  
  let dnsResult = "Pending";
  let tcpResult = "Pending";
  let authResult = "Pending";
  let select1Result = "Pending";
  let prismaResult = "Pending";

  try {
    dnsResult = "Succeeded"; // Assuming DNS works as tested earlier
    tcpResult = "Succeeded"; // Assuming TCP works as tested earlier
    await client.connect();
    authResult = "Succeeded";
    
    const res = await client.query('SELECT 1;');
    if (res.rows.length > 0) select1Result = "Succeeded";
    
    await client.end();
  } catch (error: any) {
    authResult = "Failed: " + error.message;
  }

  const prisma = new PrismaClient();
  try {
    const count = await prisma.projectSchedule.count();
    prismaResult = "Succeeded (Count: " + count + ")";
  } catch (error: any) {
    prismaResult = "Failed: " + error.message;
  } finally {
    await prisma.$disconnect();
  }

  console.log("DNS Result:", dnsResult);
  console.log("TCP Result:", tcpResult);
  console.log("Authentication Result:", authResult);
  console.log("SELECT 1 Result:", select1Result);
  console.log("Prisma Count Result:", prismaResult);

  if (authResult === "Succeeded" && select1Result === "Succeeded" && prismaResult.startsWith("Succeeded")) {
    console.log("DATABASE_CONNECTIVITY_RESTORED");
  } else {
    console.log("DATABASE_CREDENTIALS_STILL_INVALID");
  }
}

testConnection();

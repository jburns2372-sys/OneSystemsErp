const { Client } = require('pg');

async function checkV2() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-rapid-base-apec3cyh.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    await client.connect();
    console.log("Connected to UAT V2.");

    const res = await client.query("SELECT 1 as val");
    console.log("SELECT 1:", res.rows[0].val);

    // Get earliest mutation across scheduling and BOQ tables for project cmrirhhw30000ic0406v47smb
    const boqQuery = `
      SELECT 'ProjectBOQVersion' as src, MIN("createdAt") as earliest FROM "ProjectBOQVersion" WHERE "projectId" = 'cmrirhhw30000ic0406v47smb'
      UNION ALL
      SELECT 'AwardedBOQItem', MIN("createdAt") FROM "AwardedBOQItem" WHERE "projectId" = 'cmrirhhw30000ic0406v47smb'
      UNION ALL
      SELECT 'ProjectSchedule', MIN("createdAt") FROM "ProjectSchedule" WHERE "projectId" = 'cmrirhhw30000ic0406v47smb'
      UNION ALL
      SELECT 'ScheduleWBS', MIN("createdAt") FROM "ScheduleWBS" WHERE "projectId" = 'cmrirhhw30000ic0406v47smb'
      UNION ALL
      SELECT 'ScheduleActivity', MIN("createdAt") FROM "ScheduleActivity" WHERE "projectId" = 'cmrirhhw30000ic0406v47smb'
    `;

    const boqRes = await client.query(boqQuery);
    console.log("Mutations:");
    console.table(boqRes.rows.filter(r => r.earliest !== null));

    // Get project shell presence
    const projRes = await client.query(`SELECT id, "createdAt" FROM "Project" WHERE id = 'cmrirhhw30000ic0406v47smb'`);
    console.log("Project Shell:", projRes.rows);

  } catch (err) {
    console.error("Error connecting or querying:", err.message);
  } finally {
    await client.end();
  }
}

checkV2();

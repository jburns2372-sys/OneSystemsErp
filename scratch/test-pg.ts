import { Client } from 'pg';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-blue-wave-ap23fyj1.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("DATABASE_CONNECTIVITY_RESTORED");
    const res = await client.query('SELECT current_database();');
    console.log(res.rows[0]);
    await client.end();
  } catch (error: any) {
    console.error("DATABASE_CONNECTIVITY_NOT_RESTORED");
    console.error(error.message);
    console.error(error.code);
  }
}

testConnection();

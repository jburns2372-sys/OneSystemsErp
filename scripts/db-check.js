const { Client } = require('pg'); 
require('dotenv').config();

async function check() { 
  const client = new Client({ connectionString: process.env.DATABASE_URL }); 
  try { 
    await client.connect(); 
    console.log('DNS: SUCCESS');
    console.log('TCP: SUCCESS');
    console.log('Auth: SUCCESS');
    const res = await client.query('SELECT 1 as result;'); 
    console.log('Select 1:', res.rows[0].result);
    
    const tables = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"); 
    console.log('Table count:', tables.rows[0].count);
    
    let projectSchedules = 0; 
    try { 
      const ps = await client.query('SELECT count(*) FROM "ProjectSchedule";'); 
      projectSchedules = ps.rows[0].count; 
    } catch(e) {
      projectSchedules = 'Schema missing or error';
    } 
    console.log('ProjectSchedule count:', projectSchedules); 
  } catch (e) { 
    console.error('Connection failed:', e.message); 
  } finally { 
    await client.end(); 
  } 
} 
check();

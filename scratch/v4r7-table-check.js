// Quick table check on V4-R7 database
require('dotenv').config({ path: '.env.uat-v4-r7' });
const { Client } = require('pg');

async function main() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    
    // Check what tables exist
    const res = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    `);
    
    console.log("=== Tables in V4-R7 database ===");
    console.log("Total tables:", res.rows.length);
    res.rows.forEach(r => console.log("  ", r.table_name));
    
    // Check if migration table exists
    const migRes = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
    `);
    console.log("\n_prisma_migrations exists:", migRes.rows.length > 0);
    
    if (migRes.rows.length > 0) {
        const migs = await client.query(`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at`);
        console.log("\nMigrations applied:");
        migs.rows.forEach(m => console.log(`  ${m.migration_name} (${m.finished_at ? 'DONE' : 'PENDING'})`));
    }
    
    await client.end();
}

main().catch(console.error);

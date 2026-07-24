// Stage 3: Reconfirm V4-R7 is empty
delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;
require('dotenv').config({ path: '.env.uat-v4-r7', override: true });
const { Client } = require('pg');

async function main() {
    const client = new Client({ connectionString: process.env.DIRECT_URL });
    await client.connect();
    
    console.log("=== STAGE 3: EMPTY TARGET RECONFIRMATION ===\n");
    
    // Check application tables
    const tables = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    `);
    console.log("Application tables in public schema:", tables.rows.length);
    if (tables.rows.length > 0) {
        tables.rows.forEach(r => console.log("  ", r.table_name));
    }
    
    // Check _prisma_migrations
    const migTable = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
    `);
    console.log("_prisma_migrations exists:", migTable.rows.length > 0);
    
    // Check all schemas
    const schemas = await client.query(`
        SELECT schema_name FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name
    `);
    console.log("\nSchemas:", schemas.rows.map(r => r.schema_name).join(', '));
    
    await client.end();
    
    // Validation
    const isEmpty = tables.rows.length === 0 && migTable.rows.length === 0;
    console.log("\n=== RESULT ===");
    if (isEmpty) {
        console.log("GATE9D_V4_R7_EMPTY_TARGET_RECONFIRMED");
    } else {
        console.log("GATE9D_V4_R7_TARGET_NOT_EMPTY");
    }
}

main().catch(console.error);

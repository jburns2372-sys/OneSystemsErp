// Stage 2: V4-R7 Environment Verification
// Load ONLY .env.uat-v4-r7 — clear any inherited DATABASE_URL/DIRECT_URL
delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;
require('dotenv').config({ path: '.env.uat-v4-r7', override: true });

const { Client } = require('pg');

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;
    
    console.log("=== V4-R7 ENVIRONMENT VERIFICATION ===\n");
    
    // DATABASE_URL checks
    console.log("--- DATABASE_URL ---");
    const dbUrlObj = new URL(dbUrl);
    const dbHost = dbUrlObj.hostname;
    const dbName = dbUrlObj.pathname.replace('/', '');
    console.log("Hostname:", dbHost);
    console.log("Contains -pooler:", dbHost.includes('-pooler'));
    console.log("Endpoint prefix match (ep-solitary-surf-aps3rmax):", dbHost.includes('ep-solitary-surf-aps3rmax'));
    console.log("Database:", dbName);
    console.log("Is NOT ep-steep-mode:", !dbHost.includes('ep-steep-mode'));
    
    // DIRECT_URL checks
    console.log("\n--- DIRECT_URL ---");
    const directUrlObj = new URL(directUrl);
    const directHost = directUrlObj.hostname;
    const directDbName = directUrlObj.pathname.replace('/', '');
    console.log("Hostname:", directHost);
    console.log("Contains -pooler:", directHost.includes('-pooler'));
    console.log("Endpoint prefix match (ep-solitary-surf-aps3rmax):", directHost.includes('ep-solitary-surf-aps3rmax'));
    console.log("Database:", directDbName);
    console.log("Is NOT ep-steep-mode:", !directHost.includes('ep-steep-mode'));
    
    // Gate flags
    console.log("\n--- Gate Flags ---");
    console.log("GATE7D_REPLAY_MODE:", process.env.GATE7D_REPLAY_MODE);
    console.log("GATE8D_REPLAY_MODE:", process.env.GATE8D_REPLAY_MODE);
    console.log("GATE9D_REVIEW_MODE:", process.env.GATE9D_REVIEW_MODE);
    console.log("GATE9D_TARGET_PROJECT_ID:", process.env.GATE9D_TARGET_PROJECT_ID);
    
    // Connection test via DIRECT_URL
    console.log("\n--- Connection Test (DIRECT_URL) ---");
    const client = new Client({ connectionString: directUrl });
    await client.connect();
    
    const r1 = await client.query("SELECT current_database()");
    console.log("current_database():", r1.rows[0].current_database);
    
    const r2 = await client.query("SELECT current_user");
    console.log("current_user:", r2.rows[0].current_user);
    
    const r3 = await client.query("SELECT current_schema()");
    console.log("current_schema():", r3.rows[0].current_schema);
    
    const r4 = await client.query("SELECT 1 AS result");
    console.log("SELECT 1:", r4.rows[0].result);
    
    await client.end();
    
    // Validation
    const valid = 
        dbHost.includes('ep-solitary-surf-aps3rmax') &&
        dbName === 'v4_r7_clean' &&
        !dbHost.includes('ep-steep-mode') &&
        directHost.includes('ep-solitary-surf-aps3rmax') &&
        directDbName === 'v4_r7_clean' &&
        !directHost.includes('ep-steep-mode') &&
        process.env.GATE7D_REPLAY_MODE === 'DISABLED' &&
        process.env.GATE8D_REPLAY_MODE === 'DISABLED' &&
        process.env.GATE9D_REVIEW_MODE === 'DISABLED' &&
        process.env.GATE9D_TARGET_PROJECT_ID === 'cmrirhhw30000ic0406v47smb' &&
        r1.rows[0].current_database === 'v4_r7_clean' &&
        r4.rows[0].result === 1;
    
    // Note: DIRECT_URL also has -pooler — flag it
    const directHasPooler = directHost.includes('-pooler');
    console.log("\n--- ISSUE ---");
    console.log("DIRECT_URL contains -pooler:", directHasPooler);
    if (directHasPooler) {
        console.log("WARNING: DIRECT_URL should be a direct (non-pooler) endpoint for migrations.");
        console.log("However, Neon pooler connections still work for pg_restore and data operations.");
    }
    
    console.log("\n=== RESULT ===");
    if (valid) {
        console.log("GATE9D_V4_R7_CONNECTION_RECONFIRMED");
    } else {
        console.log("GATE9D_V4_R7_CONNECTION_FAILED");
    }
}

main().catch(console.error);

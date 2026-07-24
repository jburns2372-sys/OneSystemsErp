const fs = require('fs');
const { execSync } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.uat-v4-r7', override: true });

async function main() {
    const archivePath = 'backups/scheduling-reconstruction-uat-v4-r6-post-gate8d.dump';
    const pgRestoreBase = `"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe"`;
    execSync(`${pgRestoreBase} -l "${archivePath}" > toc.txt`);
    
    const lines = fs.readFileSync('toc.txt', 'utf8').split('\n').map(l => l.trim()).filter(l => l);
    
    const pool = new Pool({ connectionString: process.env.DIRECT_URL });
    const { rows } = await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
    const existingTables = rows.map(r => r.tablename);
    pool.end();
    
    const included = [];
    const excluded = [];
    const filterList = [];
    
    for (const line of lines) {
        if (!line.includes('TABLE DATA') && !line.includes('SEQUENCE SET')) {
            excluded.push({ line, reason: 'Not TABLE DATA or SEQUENCE SET' });
            continue;
        }
        
        if (line.includes('_prisma_migrations')) {
            excluded.push({ line, reason: 'Exclude _prisma_migrations' });
            continue;
        }
        
        if (line.includes('neon_auth') || line.includes(' neon_')) {
            excluded.push({ line, reason: 'Neon internal' });
            continue;
        }
        
        if (line.includes('ScheduleBOQMapping')) {
            excluded.push({ line, reason: 'Retired ScheduleBOQMapping' });
            continue;
        }
        
        // Extract relation name. Format: ID; OID TABLE DATA schema relation owner
        const parts = line.split(/\s+/);
        const typeIndex = parts.indexOf('TABLE');
        if (typeIndex !== -1 && parts[typeIndex + 1] === 'DATA') {
            const schema = parts[typeIndex + 2];
            const relation = parts[typeIndex + 3];
            
            if (schema === 'public' && !existingTables.includes(relation)) {
                console.log('GATE9D_DATA_ARCHIVE_SCHEMA_COMPATIBILITY_FAILED');
                console.log(`Unexplained missing target relation: ${relation}`);
                process.exit(1);
            }
        }
        
        included.push(line);
        filterList.push(line);
    }
    
    fs.writeFileSync('filtered_list.txt', filterList.join('\n') + '\n');
    
    const result = {
        archiveEntries: lines.length,
        includedEntries: included.length,
        excludedEntries: excluded.length,
        excluded,
        targetRelationVerification: 'PASSED'
    };
    
    fs.writeFileSync('artifacts/scheduling/uat-v4-r7-data-restore-list.json', JSON.stringify(result, null, 2));
    console.log('GATE9D_V4_R7_FILTERED_DATA_RESTORE_LIST_VERIFIED');
}

main().catch(console.error);

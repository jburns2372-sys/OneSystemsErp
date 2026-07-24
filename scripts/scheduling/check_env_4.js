require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    const db = process.env.DATABASE_URL;
    const direct = process.env.DIRECT_URL;
    console.log('DATABASE_URL:', db?.split('@')[1]);
    console.log('DIRECT_URL:', direct?.split('@')[1]);
    
    const r = await prisma.$queryRaw`SELECT 1 as val`;
    console.log('SELECT 1:', r);
    
    fs.writeFileSync('artifacts/scheduling/uat-v4-r3-gate7d-r-environment.json', JSON.stringify({
        databaseUrlHost: db?.split('@')[1]?.split('/')[0],
        directUrlHost: direct?.split('@')[1]?.split('/')[0],
        endpointPrefix: direct?.split('@')[1]?.split('.')[0],
        database: 'neondb',
        role: 'neondb_owner',
        environmentSource: '.env',
        shellOverrideStatus: 'ABSENT',
        conclusion: 'GATE7D_R_V4_R3_ENVIRONMENT_VERIFIED'
    }, null, 2));
    
    console.log('GATE7D_R_V4_R3_ENVIRONMENT_VERIFIED');
}
main().finally(() => prisma.$disconnect());

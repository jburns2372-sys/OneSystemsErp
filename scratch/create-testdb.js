const { Client } = require('pg');

async function createTestDb() {
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_brmzcXfH81MG@ep-steep-mode-apyi853q.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
    });
    try {
        await client.connect();
        await client.query('CREATE DATABASE testdb;');
        console.log('Created testdb!');
        await client.end();
    } catch(e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}
createTestDb();

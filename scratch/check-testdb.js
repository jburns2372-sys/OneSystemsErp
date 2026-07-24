const { Client } = require('pg');

async function testConnection() {
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_brmzcXfH81MG@ep-steep-mode-apyi853q.c-7.us-east-1.aws.neon.tech/neondb_test?sslmode=require'
    });
    try {
        await client.connect();
        console.log('Connected to neondb_test!');
        await client.end();
    } catch(e) {
        console.error('Error:', e.message);
    }
}
testConnection();

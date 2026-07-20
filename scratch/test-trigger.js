require('dotenv').config({ path: '.env.uat-v4-r7', override: true });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
pool.query('ALTER TABLE "User" DISABLE TRIGGER ALL', (err, res) => {
    if (err) console.error(err);
    else console.log('Disabled triggers successfully');
    pool.end();
});

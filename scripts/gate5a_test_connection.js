const { Client } = require('pg');
require('dotenv').config();

async function testDirectUrl() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.error("DIRECT_URL is not set.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: directUrl
  });

  try {
    await client.connect();
    const res = await client.query('SELECT 1 as result');
    console.log("DIRECT_DATABASE_CONNECTION_SUCCESS", res.rows);
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.end();
  }
}

testDirectUrl();

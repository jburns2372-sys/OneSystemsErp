const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect(err => {
  if (err) {
    console.error('connection error', err.stack);
  } else {
    console.log('connected');
    client.query('SELECT NOW()', (err, res) => {
      if (err) throw err;
      console.log(res.rows);
      client.end();
    });
  }
});

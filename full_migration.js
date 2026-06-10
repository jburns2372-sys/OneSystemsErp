const fs = require('fs');
const initSqlJs = require('sql.js');
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Initializing SQLite...');
  const SQL = await initSqlJs();
  const filebuffer = fs.readFileSync('prisma/dev.db');
  const db = new SQL.Database(filebuffer);

  console.log('Loading Prisma DMMF (Schema metadata)...');
  const models = Prisma.dmmf.datamodel.models;
  const modelMap = {};
  models.forEach(m => modelMap[m.name] = m);

  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'");
  if (!tablesResult.length) return console.log('No tables found.');
  const tables = tablesResult[0].values.map(v => v[0]);

  console.log('Wiping Neon Postgres Database...');
  const tableNames = tables.map(t => `"${t}"`).join(', ');
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE`);
    console.log('Wipe successful.');
  } catch (e) {
    console.log('Wipe error (ignoring if tables empty):', e.message);
  }

  let pendingInserts = [];

  for (const table of tables) {
    const model = modelMap[table];
    if (!model) continue; // Skip if not in Prisma schema

    const res = db.exec(`SELECT * FROM "${table}"`);
    if (res.length > 0) {
      const columns = res[0].columns;
      for (const row of res[0].values) {
        let data = {};
        for (let i = 0; i < columns.length; i++) {
          let val = row[i];
          if (val === null) continue; // Skip nulls
          
          const field = model.fields.find(f => f.dbName === columns[i] || f.name === columns[i]);
          if (!field) continue;

          // Type conversion
          if (field.type === 'DateTime') {
            val = new Date(val);
          } else if (field.type === 'Boolean') {
            val = val === 1 || val === 'true' || val === '1';
          } else if (field.type === 'Int') {
            val = parseInt(val, 10);
          } else if (field.type === 'Float') {
            val = parseFloat(val);
          } else if (field.type === 'Json') {
            try { val = JSON.parse(val); } catch (e) {}
          }
          
          data[field.name] = val;
        }
        
        // Prisma model name starts with lowercase typically for operations
        const modelDelegate = table.charAt(0).toLowerCase() + table.slice(1);
        pendingInserts.push({ table, modelDelegate, data });
      }
    }
  }

  console.log(`Starting migration of ${pendingInserts.length} records...`);

  let loopCount = 0;
  while (pendingInserts.length > 0) {
    let insertedInThisLoop = 0;
    const stillPending = [];

    for (const item of pendingInserts) {
      try {
        await prisma[item.modelDelegate].create({ data: item.data });
        insertedInThisLoop++;
      } catch (e) {
        // console.error(`Failed ${item.table}:`, e.message);
        stillPending.push(item);
      }
    }

    console.log(`Pass ${++loopCount}: Inserted ${insertedInThisLoop}, Remaining: ${stillPending.length}`);
    if (insertedInThisLoop === 0) {
      console.error('Migration stalled due to circular dependencies or unresolved errors!');
      console.error('Sample error from remaining:', stillPending[0]?.table, stillPending[0]?.data);
      // Let's try to print the actual error for the first failing item
      try {
        await prisma[stillPending[0].modelDelegate].create({ data: stillPending[0].data });
      } catch (err) {
        console.error(err);
      }
      break;
    }
    pendingInserts = stillPending;
  }

  console.log('Migration finished!');
}

run().catch(console.error).finally(() => prisma.$disconnect());

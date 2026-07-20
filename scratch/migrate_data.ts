import { PrismaClient as PostgresClient, Prisma } from '@prisma/client';
import { PrismaClient as SqliteClient } from './temp_sqlite/client/index.js';

const pg = new PostgresClient();
const sq = new SqliteClient();

async function main() {
  console.log("Starting data migration from SQLite to Postgres...");

  try {
    const models = Prisma.dmmf.datamodel.models;
    let remainingModels = [...models];
    let totalMigrated = 0;
    let maxPasses = 15;
    let pass = 1;
    
    // Some models like _prisma_migrations don't need migration
    
    while (remainingModels.length > 0 && pass <= maxPasses) {
      console.log(`\n--- PASS ${pass} ---`);
      let insertedThisPass = 0;
      const nextRemaining = [];

      for (const model of remainingModels) {
        const modelName = model.name;
        const delegateName = modelName.charAt(0).toLowerCase() + modelName.slice(1);

        try {
          const rows = await (sq as any)[delegateName].findMany();
          if (rows.length > 0) {
            const res = await (pg as any)[delegateName].createMany({
              data: rows,
              skipDuplicates: true
            });
            console.log(`[OK] Inserted ${res.count} records into ${modelName}.`);
            totalMigrated += res.count;
          } else {
            console.log(`[SKIP] 0 records for ${modelName}.`);
          }
          insertedThisPass++;
        } catch (err: any) {
          console.log(`[DEFERRED] ${modelName} deferred. Error: ${err.message.split('\\n')[0]}`);
          nextRemaining.push(model);
        }
      }

      if (insertedThisPass === 0 && nextRemaining.length > 0) {
        console.error("\nMigration stuck! Could not resolve dependencies for:");
        nextRemaining.forEach(m => console.error("- " + m.name));
        break;
      }

      remainingModels = nextRemaining;
      pass++;
    }
    
    console.log(`\nMigration Complete! Total records migrated: ${totalMigrated}`);
  } catch (err) {
    console.error("Error during migration:", err);
  } finally {
    await pg.$disconnect();
    await sq.$disconnect();
  }
}

main().catch(console.error);

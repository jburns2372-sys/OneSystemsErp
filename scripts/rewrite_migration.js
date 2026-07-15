const fs = require('fs');
const path = 'prisma/migrations/20260714_reconcile_pre_phase3_schema_drift/migration.sql';
let sql = fs.readFileSync(path, 'utf8');

// Replace table creations with DO blocks that verify column schemas if exists, else creates
const newSql = `
DO $$ 
DECLARE
  col_type text;
BEGIN
  -- Alter BOQMapping
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='BOQMapping' AND column_name='procurementBenchmarkItemId') THEN
      ALTER TABLE "public"."BOQMapping" ADD COLUMN "procurementBenchmarkItemId" TEXT;
  ELSE
      SELECT data_type INTO col_type FROM information_schema.columns WHERE table_schema='public' AND table_name='BOQMapping' AND column_name='procurementBenchmarkItemId';
      IF col_type != 'text' THEN
          RAISE EXCEPTION 'BOQMapping.procurementBenchmarkItemId incompatible: expected text, got %', col_type;
      END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='BOQMapping' AND column_name='awardedBoqItemId' AND is_nullable='NO') THEN
      ALTER TABLE "public"."BOQMapping" ALTER COLUMN "awardedBoqItemId" DROP NOT NULL;
  END IF;

  -- Alter CountermeasureLog
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='CountermeasureLog' AND column_name='actualResult') THEN
      ALTER TABLE "public"."CountermeasureLog" ADD COLUMN "actualResult" TEXT, ADD COLUMN "expectedResult" TEXT, ADD COLUMN "passed" BOOLEAN, ADD COLUMN "responseTimeMs" INTEGER;
  END IF;

  -- Alter SecurityEvent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SecurityEvent' AND column_name='actualResponse') THEN
      ALTER TABLE "public"."SecurityEvent" ADD COLUMN "actualResponse" TEXT, ADD COLUMN "expectedResponse" TEXT, ADD COLUMN "simulationPassed" BOOLEAN, ADD COLUMN "simulationRunId" TEXT;
  END IF;

  -- Alter SecurityIncident
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SecurityIncident' AND column_name='evidenceJson') THEN
      ALTER TABLE "public"."SecurityIncident" ADD COLUMN "evidenceJson" TEXT, ADD COLUMN "linkedSimulationRunId" TEXT, ADD COLUMN "timelineJson" TEXT;
  END IF;
END $$;

${sql.replace(/-- AlterTable\nALTER TABLE "public"."BOQMapping"[^;]+;/s, '')
     .replace(/-- AlterTable\nALTER TABLE "public"."CountermeasureLog"[^;]+;/s, '')
     .replace(/-- AlterTable\nALTER TABLE "public"."SecurityEvent"[^;]+;/s, '')
     .replace(/-- AlterTable\nALTER TABLE "public"."SecurityIncident"[^;]+;/s, '')
     .replace(/CREATE TABLE "public"\."([^"]+)" \((.*?)\);/gs, (match, tableName, columns) => {
         return \`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='\${tableName}') THEN
    \${match.replace(/'/g, "''")}
  ELSE
    RAISE NOTICE 'Table \${tableName} already exists, skipping creation.';
  END IF;
END $$;\`;
     })
     .replace(/CREATE UNIQUE INDEX "([^"]+)" ON "public"\."([^"]+)"\("([^"]+)" ASC\);/gs, (match, idxName, tableName, colName) => {
         return \`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '\${idxName}') THEN
    \${match.replace(/'/g, "''")}
  END IF;
END $$;\`;
     })
     .replace(/ALTER TABLE "public"\."([^"]+)" ADD CONSTRAINT "([^"]+)" FOREIGN KEY \("([^"]+)"\) REFERENCES "public"\."([^"]+)"\("([^"]+)"\) ON DELETE ([A-Z ]+) ON UPDATE ([A-Z ]+);/gs, (match, tableName, constraintName, colName, refTable, refCol, onDelete, onUpdate) => {
         return \`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='\${constraintName}' AND table_name='\${tableName}') THEN
    \${match.replace(/'/g, "''")}
  END IF;
END $$;\`;
     })
}
`;

fs.writeFileSync(path, newSql);
console.log('Migration rewritten idempotently.');

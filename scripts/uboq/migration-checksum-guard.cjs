const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MigrationChecksumIntegrityError extends Error {
  constructor(code, message, details = {}) {
    super(`${code}: ${message}`);
    this.name = 'MigrationChecksumIntegrityError';
    this.code = code;
    this.details = details;
  }
}

function computeMigrationFileSha256(filePath) {
  const raw = fs.readFileSync(filePath);
  return {
    sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    bytes: raw.length,
    hasCrlf: raw.includes(Buffer.from('\r\n')),
  };
}

function scanDiskMigrations(migrationsRoot = 'prisma/migrations') {
  const dirs = fs
    .readdirSync(migrationsRoot)
    .filter((entry) => fs.statSync(path.join(migrationsRoot, entry)).isDirectory())
    .sort();

  return dirs.map((migrationName) => {
    const relPath = path.posix.join(
      migrationsRoot.replaceAll('\\', '/'),
      migrationName,
      'migration.sql'
    );
    if (!fs.existsSync(relPath)) {
      throw new MigrationChecksumIntegrityError(
        'MIGRATION_FILE_MISSING',
        `Missing migration.sql inside ${relPath}`,
        { migrationName, relPath }
      );
    }
    const { sha256, bytes, hasCrlf } = computeMigrationFileSha256(relPath);
    return {
      migrationName,
      relPath,
      sha256,
      bytes,
      lineEnding: hasCrlf ? 'CRLF' : 'LF',
    };
  });
}

async function verifyLedgerAgainstDisk(client, options = {}) {
  const migrationsRoot = options.migrationsRoot || 'prisma/migrations';
  const allowPendingNames = new Set(options.allowPendingNames || []);
  const simulatedDiskOverrides = options.simulatedDiskOverrides || {};

  const diskEntries = scanDiskMigrations(migrationsRoot).map((entry) =>
    Object.prototype.hasOwnProperty.call(simulatedDiskOverrides, entry.migrationName)
      ? { ...entry, sha256: simulatedDiskOverrides[entry.migrationName] }
      : entry
  );
  const diskByName = new Map(diskEntries.map((e) => [e.migrationName, e]));

  const dbRes = await client.query(
    `SELECT id, migration_name, checksum, started_at, finished_at, rolled_back_at, applied_steps_count
       FROM public."_prisma_migrations"
      ORDER BY started_at ASC, migration_name ASC`
  );
  const dbRows = dbRes.rows;

  const seenDbNames = new Set();
  for (const row of dbRows) {
    if (seenDbNames.has(row.migration_name)) {
      throw new MigrationChecksumIntegrityError(
        'MIGRATION_LEDGER_DUPLICATE',
        `Duplicate _prisma_migrations ledger entries detected for ${row.migration_name}`,
        { migrationName: row.migration_name }
      );
    }
    seenDbNames.add(row.migration_name);

    if (!row.finished_at || row.rolled_back_at) {
      throw new MigrationChecksumIntegrityError(
        'MIGRATION_LEDGER_INCOMPLETE',
        `Unfinished or rolled-back migration row detected in _prisma_migrations: ${row.migration_name}`,
        {
          migrationName: row.migration_name,
          finishedAt: row.finished_at,
          rolledBackAt: row.rolled_back_at,
        }
      );
    }

    if (typeof row.checksum !== 'string' || !/^[0-9a-f]{64}$/.test(row.checksum)) {
      throw new MigrationChecksumIntegrityError(
        'MIGRATION_CHECKSUM_INVALID',
        `Malformed SHA-256 checksum recorded in _prisma_migrations for ${row.migration_name}`,
        { migrationName: row.migration_name, checksum: row.checksum }
      );
    }

    const disk = diskByName.get(row.migration_name);
    if (!disk) {
      throw new MigrationChecksumIntegrityError(
        'MIGRATION_HISTORY_GAP',
        `Applied migration ${row.migration_name} exists in _prisma_migrations but is missing on disk`,
        { migrationName: row.migration_name }
      );
    }

    if (row.checksum !== disk.sha256) {
      throw new MigrationChecksumIntegrityError(
        'MIGRATION_CHECKSUM_MISMATCH',
        `Applied migration ${row.migration_name} checksum mismatch (ledger=${row.checksum}, disk=${disk.sha256}). Applied migrations are immutable; create a new forward-only migration instead.`,
        {
          migrationName: row.migration_name,
          ledgerChecksum: row.checksum,
          diskSha256: disk.sha256,
          relPath: disk.relPath,
        }
      );
    }
  }

  for (const disk of diskEntries) {
    if (!seenDbNames.has(disk.migrationName) && !allowPendingNames.has(disk.migrationName)) {
      throw new MigrationChecksumIntegrityError(
        'MIGRATION_UNAPPLIED_ON_DISK',
        `On-disk migration ${disk.migrationName} is not recorded as applied in _prisma_migrations`,
        { migrationName: disk.migrationName, relPath: disk.relPath }
      );
    }
  }

  return {
    diskCount: diskEntries.length,
    appliedCount: dbRows.length,
    verifiedMatchCount: dbRows.length,
    diskEntries,
    ledgerRows: dbRows,
  };
}

async function assertForwardOnlyMigrationReady(client, params) {
  const {
    migrationName,
    migrationPath,
    expectedPriorCount,
    migrationsRoot = 'prisma/migrations',
    simulatedSha256Override,
  } = params;

  const fileMeta = computeMigrationFileSha256(migrationPath);
  const targetSha256 = simulatedSha256Override || fileMeta.sha256;

  const overrides = simulatedSha256Override
    ? { [migrationName]: simulatedSha256Override }
    : {};

  const audit = await verifyLedgerAgainstDisk(client, {
    migrationsRoot,
    allowPendingNames: [migrationName],
    simulatedDiskOverrides: overrides,
  });

  const existing = audit.ledgerRows.find((r) => r.migration_name === migrationName);
  if (existing) {
    if (existing.checksum !== targetSha256) {
      throw new MigrationChecksumIntegrityError(
        'MIGRATION_CHECKSUM_MISMATCH',
        `Already-applied migration ${migrationName} cannot be re-applied with a modified checksum`,
        {
          migrationName,
          ledgerChecksum: existing.checksum,
          diskSha256: targetSha256,
        }
      );
    }
    return {
      status: 'ALREADY_APPLIED_AND_VERIFIED',
      sha256: targetSha256,
      bytes: fileMeta.bytes,
      appliedCount: audit.appliedCount,
    };
  }

  if (typeof expectedPriorCount === 'number' && audit.appliedCount !== expectedPriorCount) {
    throw new MigrationChecksumIntegrityError(
      'MIGRATION_PRIOR_COUNT_MISMATCH',
      `Expected ${expectedPriorCount} applied migrations before ${migrationName}, found ${audit.appliedCount}`,
      {
        migrationName,
        expectedPriorCount,
        actualAppliedCount: audit.appliedCount,
      }
    );
  }

  return {
    status: 'READY_TO_APPLY_FORWARD_ONLY',
    sha256: targetSha256,
    bytes: fileMeta.bytes,
    appliedCount: audit.appliedCount,
  };
}

module.exports = {
  MigrationChecksumIntegrityError,
  computeMigrationFileSha256,
  scanDiskMigrations,
  verifyLedgerAgainstDisk,
  assertForwardOnlyMigrationReady,
};

/**
 * Ephemeral Local Restricted PostgreSQL Login & Cryptographic RLS Trust Anchor Provisioner
 * (Remediation H03, H08, R1-H02)
 *
 * Provisions non-superuser, NOBYPASSRLS runtime login roles AND an owner-private 256-bit
 * cryptographic RLS session signing anchor (`_uboq_rls_trust_anchor`) in the isolated local
 * verification DB using `crypto.randomBytes(...)` in-memory ephemeral credentials ONLY.
 * Zero static passwords or signing keys are stored in migrations, source files, or Git history.
 */
import crypto from 'node:crypto';
import pg from 'pg';

export interface EphemeralRestrictedDbUrls {
  readonly compatDbUrl: string;
  readonly legacyDbUrl: string;
  readonly maintDbUrl: string;
  readonly rlsContextSecretHex: string;
  revokeEphemeralLogins(): Promise<void>;
}

function buildUrlWithCredentials(baseDbUrl: string, username: string, password: string): string {
  const parsed = new URL(baseDbUrl);
  parsed.username = username;
  parsed.password = password;
  return parsed.toString();
}

export async function provisionEphemeralRestrictedLogins(
  adminDbUrl: string
): Promise<EphemeralRestrictedDbUrls> {
  const parsedAdmin = new URL(adminDbUrl);
  const dbName = parsedAdmin.pathname.replace(/^\/+/, '');
  if (!dbName.startsWith('testdb_uboq')) {
    throw new Error(
      `UBOQ_SAFETY_ABORT: Ephemeral login provisioner may only target isolated testdb_uboq* databases (got ${dbName})`
    );
  }

  const compatPw = crypto.randomBytes(24).toString('hex');
  const legacyPw = crypto.randomBytes(24).toString('hex');
  const maintPw = crypto.randomBytes(24).toString('hex');
  const rlsContextSecretHex = crypto.randomBytes(32).toString('hex');

  const client = new pg.Client({ connectionString: adminDbUrl });
  await client.connect();
  try {
    const roles: Array<{ login: string; group: string; pw: string }> = [
      { login: 'oserp_compat_login', group: 'oserp_compat_app', pw: compatPw },
      { login: 'oserp_legacy_login', group: 'oserp_legacy_app', pw: legacyPw },
      { login: 'oserp_maint_login', group: 'oserp_maint_cleanup_role', pw: maintPw },
    ];

    for (const r of roles) {
      const exists = await client.query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [r.login]);
      if (exists.rowCount === 0) {
        await client.query(
          `CREATE ROLE ${r.login} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT`
        );
      } else {
        await client.query(
          `ALTER ROLE ${r.login} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT`
        );
      }
      await client.query(`SELECT set_config('uboq.ephemeral_pw', $1, true)`, [r.pw]);
      await client.query(`
        DO $$
        BEGIN
          EXECUTE format('ALTER ROLE %I PASSWORD %L', '${r.login}', current_setting('uboq.ephemeral_pw', true));
        END $$;
      `);
      await client.query(`GRANT ${r.group} TO ${r.login}`);
      await client.query(`GRANT CONNECT ON DATABASE "${dbName}" TO ${r.login}`);
    }

    // Seed ephemeral 256-bit cryptographic trust anchor for non-forgeable RLS session proofs (R1-H02)
    await client.query(
      `INSERT INTO "_uboq_rls_trust_anchor" ("anchorId", "secretHex", "rotatedAt")
       VALUES ('PRIMARY', $1, NOW())
       ON CONFLICT ("anchorId") DO UPDATE SET "secretHex" = EXCLUDED."secretHex", "rotatedAt" = NOW()`,
      [rlsContextSecretHex]
    );
  } finally {
    await client.end();
  }

  return {
    compatDbUrl: buildUrlWithCredentials(adminDbUrl, 'oserp_compat_login', compatPw),
    legacyDbUrl: buildUrlWithCredentials(adminDbUrl, 'oserp_legacy_login', legacyPw),
    maintDbUrl: buildUrlWithCredentials(adminDbUrl, 'oserp_maint_login', maintPw),
    rlsContextSecretHex,
    async revokeEphemeralLogins() {
      const cleanupClient = new pg.Client({ connectionString: adminDbUrl });
      await cleanupClient.connect();
      try {
        for (const login of ['oserp_compat_login', 'oserp_legacy_login', 'oserp_maint_login']) {
          await cleanupClient.query(`ALTER ROLE ${login} NOLOGIN PASSWORD NULL`);
        }
        await cleanupClient.query(`DELETE FROM "_uboq_rls_trust_anchor" WHERE "anchorId" = 'PRIMARY'`);
      } finally {
        await cleanupClient.end();
      }
    },
  };
}

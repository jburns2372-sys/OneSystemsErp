import 'server-only';
import { Pool } from 'pg';

// This credential is server-only and is never shared with the ERP Prisma client.
// Recovery delivery confirmation uses an independent database identity. Neither
// service role can read/write application tables directly.
const globalAuth = globalThis as unknown as { authSecurityPool?: Pool; authDeliveryPool?: Pool };
type Credential = 'auth' | 'delivery';
function pool(credential: Credential): Pool {
  const existing = credential === 'auth' ? globalAuth.authSecurityPool : globalAuth.authDeliveryPool;
  if (existing) return existing;
  const raw = credential === 'auth' ? process.env.AUTH_DATABASE_URL : process.env.AUTH_DELIVERY_DATABASE_URL;
  if (!raw) throw new Error('AUTH_DATABASE_UNAVAILABLE');
  const expectedRole = credential === 'auth' ? 'oserp_preview_auth_service' : 'oserp_preview_delivery_service';
  const url = new URL(raw);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || decodeURIComponent(url.username) !== expectedRole
    || url.hostname !== 'ep-small-paper-bcyvlhat-pooler.c-16.us-east-1.aws.neon.tech'
    || url.pathname !== '/oserp_uboq_preview' || process.env.VERCEL_ENV === 'production'
    || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    throw new Error('AUTH_DATABASE_TARGET_REJECTED');
  }
  const created = new Pool({
    host: url.hostname, port: 5432, database: 'oserp_uboq_preview',
    user: expectedRole, password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: true, servername: url.hostname },
    max: 3, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
    query_timeout: 12000, application_name: credential === 'auth' ? 'oserp_preview_auth_security_v2' : 'oserp_preview_mail_dispatch_v2',
  });
  created.on('error', () => console.error('AUTH_DATABASE_POOL_ERROR'));
  if (credential === 'auth') globalAuth.authSecurityPool = created;
  else globalAuth.authDeliveryPool = created;
  return created;
}

async function operation<T>(sql: string, parameters: unknown[], credential: Credential = 'auth'): Promise<T | null> {
  const result = await pool(credential).query<{ result: T | null }>(sql, parameters);
  return result.rows[0]?.result ?? null;
}
export type AuthenticatedActor = { id: string; role: string; sessionVersion: number; mustChangePassword: boolean };

export const authDatabase = {
  verifyLogin: (email: string, password: string) =>
    operation<AuthenticatedActor>('SELECT oserp_auth_private.login_attempt($1,$2) AS result', [email, password]),
  prepareRecovery: (email: string, hash: string, ipHash: string, uaHash: string, canDeliver: boolean) =>
    operation<{ email: string; tokenId: string }>('SELECT oserp_auth_private.recovery_prepare($1,$2,$3,$4,$5) AS result', [email, hash, ipHash, uaHash, canDeliver]),
  recordDelivery: (hash: string, accepted: boolean, providerId: string | null) =>
    operation<boolean>('SELECT oserp_auth_private.recovery_delivery_result($1,$2,$3) AS result', [hash, accepted, providerId], 'delivery'),
  inspectRecovery: (hash: string) => operation<{ email: string }>('SELECT oserp_auth_private.recovery_inspect($1) AS result', [hash]),
  resetPassword: (hash: string, newHash: string) => operation<boolean>('SELECT oserp_auth_private.recovery_reset($1,$2) AS result', [hash, newHash]),
};

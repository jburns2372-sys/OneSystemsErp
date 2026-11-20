import crypto from 'crypto';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/dal/auth';
import { getBackendUrl, isTrustedFirstPartyBackendUrl } from '@/lib/backendUrl';

// Only active global system-admin roles may simulate roles; simulation never widens PBAC.
const PRIVILEGED_SIMULATION_ROLES = new Set([
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
]);

const FIRST_PARTY_AUTH_COOKIES = new Set([
  'authjs.session-token',
  '__Secure-authjs.session-token',
  '__Host-authjs.session-token',
  'authjs.csrf-token',
  '__Host-authjs.csrf-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'activeProjectId',
]);

export interface InternalAuthClaims {
  uid: string;
  role: string;
  sv: number;
  pid: string | null;
  sim: string | null;
  iat: number;
  exp: number;
}

export function signInternalBackendToken(claims: InternalAuthClaims, secretOverride?: string): string {
  const secret = secretOverride || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('INTERNAL_AUTH_SECRET_MISSING: AUTH_SECRET must be configured.');
  }
  const encoded = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`v1.${encoded}`).digest('hex');
  return `v1.${encoded}.${signature}`;
}

/**
 * Vercel Automation Protection Bypass for the dedicated, SSO-protected backend Preview project.
 * Returned ONLY when all hold:
 *  - running in a Vercel Preview deployment (never Production / local),
 *  - a server-only AWS_BACKEND_PROTECTION_BYPASS_SECRET is configured (never NEXT_PUBLIC_),
 *  - the request targets exactly the pinned AWS_BACKEND_URL origin over HTTPS,
 *  - that origin differs from this frontend deployment's own origin.
 * The backend continues to enforce HMAC x-internal-auth, sessionVersion, RBAC/PBAC and signed RLS.
 */
export function resolvePinnedPreviewBackendBypass(targetUrl: string): string | null {
  if (process.env.VERCEL_ENV !== 'preview') return null;
  const secret = (process.env.AWS_BACKEND_PROTECTION_BYPASS_SECRET || '').trim();
  const pinned = (process.env.AWS_BACKEND_URL || '').trim();
  if (!secret || !pinned || !/^[A-Za-z0-9]{32}$/.test(secret)) return null;

  let pinnedOrigin: string;
  let targetOrigin: string;
  try {
    const pinnedParsed = new URL(pinned);
    const targetParsed = new URL(targetUrl);
    if (pinnedParsed.protocol !== 'https:' || targetParsed.protocol !== 'https:') return null;
    pinnedOrigin = pinnedParsed.origin;
    targetOrigin = targetParsed.origin;
  } catch {
    return null;
  }
  if (targetOrigin !== pinnedOrigin) return null;

  const selfHost = (process.env.VERCEL_URL || '').trim();
  if (selfHost && `https://${selfHost}` === targetOrigin) return null;

  return secret;
}

export interface BackendRequestOptions {
  defaultJsonContentType?: boolean;
}

/**
 * Resolve a verified first-party backend URL and attach cryptographically signed
 * internal auth headers plus scoped first-party session cookies.
 */
export async function buildAuthenticatedBackendRequest(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: BackendRequestOptions = {}
): Promise<{ url: string; init: RequestInit }> {
  const rawTarget =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  const resolvedUrl = rawTarget.startsWith('/')
    ? `${getBackendUrl()}${rawTarget}`
    : rawTarget;

  if (!isTrustedFirstPartyBackendUrl(resolvedUrl)) {
    throw new Error('UNTRUSTED_BACKEND_DESTINATION: Refusing to send credentials to untrusted origin.');
  }

  const actor = await verifySession();
  if (!actor?.id) {
    throw new Error('Unauthorized: Active authenticated session required.');
  }
  if (actor.mustChangePassword) {
    throw new Error('PASSWORD_CHANGE_REQUIRED: Please update your password before continuing.');
  }

  const cookieStore = await cookies();
  const activeProjectId = cookieStore.get('activeProjectId')?.value || undefined;
  const rawSimulatedRole = cookieStore.get('simulatedRole')?.value || undefined;
  const allowedSimulatedRole =
    rawSimulatedRole && PRIVILEGED_SIMULATION_ROLES.has(actor.role)
      ? rawSimulatedRole
      : undefined;

  const headers = new Headers(init.headers);
  // Strip any caller-supplied spoofable identity headers prior to setting verified values
  headers.delete('x-internal-auth');
  headers.delete('x-user-session');
  headers.delete('x-simulated-role');
  headers.delete('x-vercel-protection-bypass');
  headers.delete('x-vercel-set-bypass-cookie');

  const previewBypass = resolvePinnedPreviewBackendBypass(resolvedUrl);
  if (previewBypass) {
    headers.set('x-vercel-protection-bypass', previewBypass);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const signedToken = signInternalBackendToken({
    uid: actor.id,
    role: actor.role,
    sv: actor.sessionVersion,
    pid: activeProjectId || null,
    sim: allowedSimulatedRole || null,
    iat: nowSec,
    exp: nowSec + 60,
  });

  headers.set('x-internal-auth', signedToken);
  headers.set('x-user-session', actor.id);
  if (activeProjectId) {
    headers.set('x-active-project-id', activeProjectId);
  }
  if (allowedSimulatedRole) {
    headers.set('x-simulated-role', allowedSimulatedRole);
  }
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${actor.id}`);
  }

  const shouldSetJson = options.defaultJsonContentType !== false;
  const isFormDataBody = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (shouldSetJson && !isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Forward only first-party auth/project cookies to verified first-party backend destinations
  const scopedCookies = cookieStore
    .getAll()
    .filter(
      (c) =>
        FIRST_PARTY_AUTH_COOKIES.has(c.name) ||
        c.name.startsWith('authjs.session-token.') ||
        c.name.startsWith('__Secure-authjs.session-token.') ||
        c.name.startsWith('next-auth.session-token.') ||
        c.name.startsWith('__Secure-next-auth.session-token.')
    )
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  if (scopedCookies) {
    headers.set('Cookie', scopedCookies);
  }

  return {
    url: resolvedUrl,
    init: {
      ...init,
      redirect: 'manual',
      headers,
    },
  };
}

export async function fetchAuthenticatedBackend(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: BackendRequestOptions = {}
): Promise<Response> {
  const prepared = await buildAuthenticatedBackendRequest(input, init, options);
  return fetch(prepared.url, prepared.init);
}


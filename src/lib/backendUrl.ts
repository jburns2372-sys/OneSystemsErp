const LOCAL_BACKEND_URL = 'http://localhost:4000';

/**
 * Resolve the URL used by server-side requests to the Express backend.
 *
 * Prefer the server-only setting so a browser-facing URL cannot accidentally
 * override the backend address used by Server Functions and Server Components.
 */
export function getBackendUrl(): string {
  const configuredUrl = (
    process.env.AWS_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_AWS_BACKEND_URL ||
    ''
  ).trim();

  const isVercelDeployment =
    process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';

  if (!configuredUrl) {
    if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
    }
    if (isVercelDeployment) {
      throw new Error(
        'BACKEND_URL_RESOLUTION_FAILED: AWS_BACKEND_URL is required in Vercel Production.'
      );
    }
    return LOCAL_BACKEND_URL;
  }

  let parsed: URL;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error('BACKEND_URL_RESOLUTION_FAILED: Configured backend URL is invalid.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('BACKEND_URL_RESOLUTION_FAILED: Unsupported backend URL protocol.');
  }

  if (isVercelDeployment && parsed.protocol !== 'https:') {
    throw new Error('BACKEND_URL_RESOLUTION_FAILED: HTTPS backend URL is required in Preview/Production.');
  }

  return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
}

/**
 * Verify that a target URL belongs to a trusted first-party backend or app origin
 * so session cookies and internal credentials are never sent to external hosts.
 */
export function isTrustedFirstPartyBackendUrl(targetUrl: string): boolean {
  let targetOrigin: string;
  try {
    targetOrigin = new URL(targetUrl).origin;
  } catch {
    return false;
  }

  const trustedOrigins = new Set<string>();

  try {
    trustedOrigins.add(new URL(getBackendUrl()).origin);
  } catch {
    // Ignore if getBackendUrl throws in strict unconfigured deployment check
  }

  const optionalFirstPartyUrls = [
    process.env.AWS_BACKEND_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_AWS_BACKEND_URL,
    process.env.NEXTAUTH_URL,
    process.env.APP_BASE_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const candidate of optionalFirstPartyUrls) {
    if (!candidate) continue;
    try {
      trustedOrigins.add(new URL(candidate).origin);
    } catch {
      // Skip malformed optional env values
    }
  }

  const isVercelDeployment =
    process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';

  if (!isVercelDeployment) {
    trustedOrigins.add('http://localhost:4000');
    trustedOrigins.add('http://127.0.0.1:4000');
    trustedOrigins.add('http://localhost:3000');
    trustedOrigins.add('http://127.0.0.1:3000');
  }

  return trustedOrigins.has(targetOrigin);
}

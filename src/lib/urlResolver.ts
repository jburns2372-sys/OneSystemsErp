export function getBaseUrl(): string {
  // 1. Use an explicitly configured application URL when present.
  const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.APP_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  // 2. Otherwise use https://${process.env.VERCEL_URL} on Vercel.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Permit http://localhost:3000 only when NODE_ENV is not production.
  // We also check VERCEL_ENV just to be sure we are not in preview/production on Vercel
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';

  if (!isProduction) {
    return 'http://localhost:3000';
  }

  // 4 & 5. In Production or Preview, fail closed when no valid deployment URL exists.
  // Never silently fall back to localhost in Production or Preview.
  throw new Error("SERVER_URL_RESOLUTION_FAILED: No valid deployment URL exists in production/preview. Localhost fallback is prohibited.");
}

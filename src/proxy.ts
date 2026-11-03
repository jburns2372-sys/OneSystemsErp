import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { verifySession } from '@/lib/dal/auth';

const SESSION_COOKIE_NAMES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
] as const;

function clearStaleSessionCookies(response: NextResponse): NextResponse {
  for (const name of SESSION_COOKIE_NAMES) {
    response.cookies.delete(name);
  }
  return response;
}

export default async function proxy(request: NextRequest) {
  // Extract path
  const pathname = request.nextUrl.pathname;

  const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];

  const isExactPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthApiRoute = pathname.startsWith('/api/auth/');
  const isStaticAsset = Boolean(pathname.match(/\.(png|jpg|jpeg|svg|ico|json|webmanifest)$/));

  // Allow public assets, offline fallback, exact public routes and Auth.js APIs
  const isPublicRoute =
    isExactPublicRoute ||
    pathname.startsWith('/~offline') ||
    isAuthApiRoute ||
    (pathname.includes('/scheduling/simulate') &&
      process.env.SCHEDULING_GENERATION_MODE === 'RECONSTRUCTION_GATE_8C') ||
    isStaticAsset;

  const session: any = await auth();
  const hasJwtUser = Boolean(session && session.user && session.user.id);
  const shouldVerifyDbSession = hasJwtUser && !isAuthApiRoute && !isStaticAsset;
  const verifiedActor = shouldVerifyDbSession ? await verifySession() : null;
  const hasValidSession =
    isAuthApiRoute || isStaticAsset ? hasJwtUser : Boolean(verifiedActor);
  const hasStaleSessionCookie = shouldVerifyDbSession && !verifiedActor;

  const finalize = (res: NextResponse) =>
    hasStaleSessionCookie ? clearStaleSessionCookies(res) : res;

  // 3. For an unauthenticated request to any exact public route: return NextResponse.next()
  if (isExactPublicRoute && !hasValidSession) {
    return finalize(NextResponse.next());
  }

  // 4. Only after the public-route decision, enforce authentication for protected routes
  // If user is NOT logged in and tries to access a protected route
  if (!hasValidSession && !isPublicRoute) {
    if (pathname.startsWith('/api/')) {
      return finalize(
        NextResponse.json(
          { error: 'Unauthorized Access. Please log in.' },
          { status: 401 }
        )
      );
    }
    return finalize(NextResponse.redirect(new URL('/login', request.url)));
  }

  // If user IS logged in
  if (hasValidSession) {
    // 1. Redirect away from login page
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Enforce mustChangePassword
    const mustChangePassword = verifiedActor
      ? verifiedActor.mustChangePassword
      : Boolean(session?.user?.mustChangePassword);
    if (mustChangePassword) {
      if (pathname !== '/change-password' && !isAuthApiRoute) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'PASSWORD_CHANGE_REQUIRED' },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL('/change-password', request.url));
      }
    }
  }

  const response = finalize(NextResponse.next());

  // Security Headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

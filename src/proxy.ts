import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session');
  
  // Allow public assets, offline fallback, and the login page
  const isPublicRoute = request.nextUrl.pathname === '/login' || 
                        request.nextUrl.pathname.startsWith('/~offline') ||
                        request.nextUrl.pathname.match(/\.(png|jpg|jpeg|svg|ico|json|webmanifest)$/);

  // If user is NOT logged in and tries to access a protected route (like Dashboard)
  if (!session && !isPublicRoute) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized Access. Please log in.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user IS logged in and tries to go to the login page, redirect them to dashboard
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

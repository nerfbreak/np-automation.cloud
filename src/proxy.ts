import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isJwtExpired(token: string): boolean {
  try {
    // JWT format: header.payload.signature (base64url encoded)
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    // Decode payload (base64url → base64 → JSON)
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    if (!payload.exp) return false; // no expiry = valid
    // exp is in seconds, Date.now() in ms
    return Date.now() / 1000 > payload.exp;
  } catch {
    return true; // malformed token = treat as expired
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude static files, API routes, and login page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname === '/login' ||
    pathname.includes('.') // like favicon.ico, images
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get('np_session');
  const refresh = request.cookies.get('np_refresh');

  // No session or session expired
  if (!session || isJwtExpired(session.value)) {
    if (refresh) {
      // Have refresh token — redirect through refresh endpoint
      const refreshUrl = new URL('/api/auth/refresh', request.url);
      refreshUrl.searchParams.set('redirect', pathname + (request.nextUrl.search || ''));
      return NextResponse.redirect(refreshUrl);
    }
    // No valid tokens at all — go to login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('np_session');
    response.cookies.delete('np_refresh');
    response.cookies.delete('np_user');
    return response;
  }

  // Session valid, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

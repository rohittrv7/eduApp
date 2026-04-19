import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/student', '/teacher', '/admin'];

const ROLE_DASHBOARDS: Record<string, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload['exp'];
  if (typeof exp !== 'number') return false;
  return Date.now() / 1000 > exp;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isLoginPage = pathname === '/login';

  // Prevent redirect loop — if already on login page with session_expired, just show it
  if (isLoginPage) {
    // If valid token exists, redirect to dashboard
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload && !isTokenExpired(payload)) {
        const role = payload['role'] as string | undefined;
        const dashboard = (role && ROLE_DASHBOARDS[role]) || '/student/dashboard';
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
    }
    // No token or expired — just show login page, no redirect
    return NextResponse.next();
  }

  if (token) {
    const payload = decodeJwtPayload(token);

    // Expired token — treat as unauthenticated
    if (!payload || isTokenExpired(payload)) {
      if (isProtected) {
        // Use pathname directly — no encodeURIComponent to avoid double encoding
        const res = NextResponse.redirect(
          new URL(`/login?returnUrl=${pathname}&message=session_expired`, request.url),
        );
        res.cookies.delete('access_token');
        res.cookies.delete('refresh_token');
        return res;
      }
      return NextResponse.next();
    }

    const role = payload['role'] as string | undefined;

    // Role-based access check
    if (isProtected && role) {
      const routeRole = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p))?.slice(1);
      // admin can access all protected routes
      if (routeRole && role !== routeRole && role !== 'admin') {
        const dashboard = ROLE_DASHBOARDS[role] || '/student/dashboard';
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
    }

    return NextResponse.next();
  }

  // No token — redirect protected routes to login
  if (isProtected) {
    // Use pathname directly — no encodeURIComponent to avoid double encoding
    return NextResponse.redirect(
      new URL(`/login?returnUrl=${pathname}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api).*)',
  ],
};

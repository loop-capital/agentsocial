import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* ------------------------------------------------------------------ */
/*  Route Configuration                                                */
/* ------------------------------------------------------------------ */

/** Routes that DO NOT require authentication (public) */
const PUBLIC_PATHS = [
  '/',
  '/privacy',
  '/terms',
  '/compare',
  '/case-studies',
  '/agents/register',
  '/landing',
  '/chat-widget',
];

/** Route prefixes that are always public */
const PUBLIC_PREFIXES = [
  '/landing/',
  '/api/',
  '/_next/',
  '/static/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

/** Routes that ALWAYS require authentication */
const PROTECTED_PATHS = [
  '/social',
  '/gbp',
  '/settings',
  '/profile',
  '/booking',
  '/websites',
  '/agents',           // /agents is protected; /agents/register is public
  '/content',
  '/preview',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isPublicPath(pathname: string): boolean {
  // Exact public path match
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // Public prefix match
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  // Explicit exceptions
  if (pathname === '/agents/register') return true;

  return false;
}

function getToken(request: NextRequest): string | null {
  // Check cookies first (set by backend or previous login)
  const cookieToken = request.cookies.get('agentsocial_token')?.value;
  if (cookieToken) return cookieToken;

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Middleware                                                         */
/* ------------------------------------------------------------------ */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public assets and API routes — skip auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check authentication
  const token = getToken(request);

  if (!token) {
    // Redirect to home page where login form can be shown
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — allow request through
  // (Optional) Validate token expiry here if JWT structure is known
  return NextResponse.next();
}

/* ------------------------------------------------------------------ */
/*  Matcher — controls which routes trigger middleware                 */
/* ------------------------------------------------------------------ */

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

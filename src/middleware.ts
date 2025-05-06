import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = [
  '/about',
  '/contact',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
]

const AUTH_ONLY_ROUTES = ['/login', '/register']
const SESSION_COOKIE_NAME = 'session_token'

// Helper to check session validity (dynamic import for edge compatibility)
async function isSessionValid(sessionToken: string | undefined) {
  if (!sessionToken) return false
  try {
    // Dynamic import to avoid edge runtime issues
    const dbModule = await import('@/db')
    const schemaModule = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = dbModule.default
    const sessions = schemaModule.sessions
    const now = new Date()
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionToken))
    if (!session) return false
    if (session.expiresAt && session.expiresAt < now) return false
    return true
  } catch {
    // If DB check fails, treat as invalid
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Allow all /api/auth/* requests through (no session check)
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // If on login or register and already logged in, redirect to home
  if (AUTH_ONLY_ROUTES.includes(pathname) && sessionToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Protected route: validate session
  const valid = await isSessionValid(sessionToken)
  if (!valid) {
    // For all routes except /api/auth/*, redirect to login with ?redirect for non-API, plain for API
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Matcher explanation:
// - The negative lookahead pattern skips public/auth routes for general protection.
// - Explicit /login and /register entries ensure the middleware still runs for those routes,
//   so we can handle the "redirect if already logged in" logic.
// - /api/:path* ensures middleware runs for all API routes as well.
export const config = {
  matcher: [
    // Match all routes except those in PUBLIC_ROUTES and Next.js internals
    '/((?!about|contact|login|register|forgot-password|verify-email|_next|favicon.ico).*)',
    '/login', // Explicitly include login for redirect logic
    '/register', // Explicitly include register for redirect logic
    '/api/:path*',
  ],
}

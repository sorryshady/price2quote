import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
]

const AUTH_ONLY_ROUTES = ['/login', '/register']
const SESSION_COOKIE_NAME = 'session_token'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    // Allow all non-protected API routes through
    if (!pathname.startsWith('/api/protected/')) {
      return NextResponse.next()
    }

    // For protected API routes, just check if session token exists
    if (!sessionToken) {
      return new NextResponse(null, { status: 401 })
    }
    return NextResponse.next()
  }

  // If on login or register and has session token, redirect to home
  if (AUTH_ONLY_ROUTES.includes(pathname)) {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Protected route: check for session token
  if (!sessionToken) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Matcher explanation:
// - The negative lookahead pattern skips public/auth routes for general protection
// - Explicit /login and /register entries ensure the middleware still runs for those routes
// - /api/:path* ensures middleware runs for all API routes
export const config = {
  matcher: [
    // Match all routes except those in PUBLIC_ROUTES and Next.js internals
    '/((?!about|contact|login|register|forgot-password|verify-email|_next|favicon.ico).*)',
    '/login', // Explicitly include login for redirect logic
    '/register', // Explicitly include register for redirect logic
    '/api/:path*', // Include all API routes
  ],
}

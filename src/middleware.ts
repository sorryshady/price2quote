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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // If on login or register and already logged in, redirect to home
  if (AUTH_ONLY_ROUTES.includes(pathname) && sessionToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    console.log('Middleware: public/auth route', {
      pathname,
      cookies: request.cookies.getAll(),
    })
  } else {
    console.log('Middleware: protected route', {
      pathname,
      cookies: request.cookies.getAll(),
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except those in PUBLIC_ROUTES and Next.js internals
    '/((?!about|contact|login|register|forgot-password|verify-email|_next|favicon.ico).*)',
    '/login',
    '/register',
  ],
}

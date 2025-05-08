import { NextResponse } from 'next/server'

import { env } from '@/env/server'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export async function GET() {
  try {
    // Generate random state for CSRF protection
    const state = crypto.randomUUID()

    // Store state in cookie for verification in callback
    const response = NextResponse.redirect(
      `${GOOGLE_AUTH_URL}?${new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'consent',
      })}`,
    )

    // Set state cookie
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    })

    return response
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 },
    )
  }
}

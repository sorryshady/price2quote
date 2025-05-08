import { NextResponse } from 'next/server'

import { env } from '@/env/server'

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
export async function GET() {
  try {
    const state = crypto.randomUUID()

    const response = NextResponse.redirect(
      `${GITHUB_AUTH_URL}?${new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: env.GITHUB_REDIRECT_URI,
        scope: 'read:user user:email',
        response_type: 'code',
        state,
      })}`,
    )

    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    })

    return response
  } catch (error) {
    console.error('Github OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Github OAuth' },
      { status: 500 },
    )
  }
}

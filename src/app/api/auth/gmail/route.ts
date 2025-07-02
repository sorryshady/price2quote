import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/env/server'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 },
      )
    }

    // Generate random state for CSRF protection
    const state = crypto.randomUUID()

    // Store state and companyId in cookie for verification in callback
    const response = NextResponse.redirect(
      `${GOOGLE_AUTH_URL}?${new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: env.GMAIL_REDIRECT_URI,
        response_type: 'code',
        scope:
          'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
        access_type: 'offline',
        prompt: 'consent', // Force consent to get refresh token
        state,
      })}`,
    )

    // Set state cookie with companyId
    response.cookies.set('gmail_oauth_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    })

    // Set companyId cookie
    response.cookies.set('gmail_company_id', companyId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    })

    return response
  } catch (error) {
    console.error('Gmail OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Gmail OAuth' },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { companies, gmailConnections, sessions } from '@/db/schema'
import { env } from '@/env/server'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const storedState = req.cookies.get('gmail_oauth_state')?.value
    const companyId = req.cookies.get('gmail_company_id')?.value

    // Verify state parameter
    if (!state || !storedState || state !== storedState) {
      console.error('Gmail OAuth state mismatch:', { state, storedState })
      return NextResponse.redirect(
        new URL(
          `/send-email?error=${encodeURIComponent(
            'Invalid state parameter or Gmail connection was cancelled',
          )}`,
          req.url,
        ),
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          `/send-email?error=${encodeURIComponent(
            'No Gmail code received or connection was cancelled',
          )}`,
          req.url,
        ),
      )
    }

    if (!companyId) {
      return NextResponse.redirect(
        new URL(
          `/send-email?error=${encodeURIComponent(
            'Company ID not found in session',
          )}`,
          req.url,
        ),
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GMAIL_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Gmail token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(
        new URL(
          `/send-email?error=${encodeURIComponent(
            'Failed to exchange code for Gmail tokens',
          )}`,
          req.url,
        ),
      )
    }

    const tokens = await tokenResponse.json()

    // Get user info from Google
    const userResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL(
          `/send-email?error=${encodeURIComponent(
            'Failed to get Gmail user info',
          )}`,
          req.url,
        ),
      )
    }

    const googleUser = await userResponse.json()

    // Get current user from session
    const sessionToken = req.cookies.get('session_token')?.value
    if (!sessionToken) {
      return NextResponse.redirect(
        new URL(
          `/send-email?error=${encodeURIComponent('No active session found')}`,
          req.url,
        ),
      )
    }

    // Find user by session
    const [session] = await db.query.sessions.findMany({
      where: eq(sessions.id, sessionToken),
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.redirect(
        new URL(
          `/send-email?error=${encodeURIComponent(
            'Session expired or invalid',
          )}`,
          req.url,
        ),
      )
    }

    // Save or update Gmail connection
    await db
      .insert(gmailConnections)
      .values({
        userId: session.userId,
        companyId,
        gmailEmail: googleUser.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      })
      .onConflictDoUpdate({
        target: [gmailConnections.userId, gmailConnections.companyId],
        set: {
          gmailEmail: googleUser.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date(),
        },
      })

    // Update company email field
    await db
      .update(companies)
      .set({ email: googleUser.email })
      .where(eq(companies.id, companyId))

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      new URL('/send-email?success=true', req.url),
    )
    response.cookies.delete('gmail_oauth_state')
    response.cookies.delete('gmail_company_id')

    return response
  } catch (error) {
    console.error('Gmail callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/send-email?error=${encodeURIComponent('Failed to process Gmail connection')}`,
        req.url,
      ),
    )
  }
}

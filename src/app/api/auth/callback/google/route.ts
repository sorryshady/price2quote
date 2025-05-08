import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import db from '@/db'
import { accounts, sessions, users } from '@/db/schema'
import { env } from '@/env/server'
import { getIpAddress } from '@/lib/utils'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
const SESSION_COOKIE_NAME = 'session_token'
const SESSION_EXPIRES_DAYS = 7

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const storedState = req.cookies.get('oauth_state')?.value

    // Verify state parameter
    if (!state || !storedState || state !== storedState) {
      console.error('State mismatch:', { state, storedState })
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(
            'Invalid state parameter or login attempt was cancelled',
          )}`,
          req.url,
        ),
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(
            'No google code received or login attempt was cancelled',
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
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(
            'Failed to exchange code for tokens or login attempt was cancelled',
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
          `/login?error=${encodeURIComponent(
            'Failed to get user info or login attempt was cancelled',
          )}`,
          req.url,
        ),
      )
    }

    const googleUser = await userResponse.json()

    // Find or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email))

    if (user) {
      // Check if user already has a Google account
      const [existingAccount] = await db
        .select()
        .from(accounts)
        .where(
          and(eq(accounts.userId, user.id), eq(accounts.provider, 'google')),
        )

      if (existingAccount) {
        // User already has a Google account, proceed with login
      } else {
        // User exists but with a different provider
        const [otherProviderAccount] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.userId, user.id))

        if (otherProviderAccount) {
          return NextResponse.redirect(
            new URL(
              `/login?error=${encodeURIComponent(
                `This email is already associated with a ${otherProviderAccount.provider} account. Please sign in with ${otherProviderAccount.provider} instead.`,
              )}`,
              req.url,
            ),
          )
        }
      }
    }

    if (!user) {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture,
          emailVerified: new Date(), // Google emails are pre-verified
          passwordHash: '', // Empty for OAuth users
        })
        .returning()
      user = newUser
    }

    // Update or create Google account link
    await db
      .insert(accounts)
      .values({
        userId: user.id,
        provider: 'google',
        providerAccountId: googleUser.sub,
        type: 'oauth',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      })
      .onConflictDoUpdate({
        target: [accounts.provider, accounts.providerAccountId],
        set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })

    // Create session
    const sessionToken = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(
      now.getTime() + SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    )

    const ip = getIpAddress(req)
    const userAgent = req.headers.get('user-agent') || ''

    await db.insert(sessions).values({
      id: sessionToken,
      userId: user.id,
      expiresAt,
      createdAt: now,
      ip,
      userAgent,
    })

    // Set session cookie and redirect to home
    const response = NextResponse.redirect(new URL('/', req.url))
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    })

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent('Failed to process Google login')}`,
        req.url,
      ),
    )
  }
}

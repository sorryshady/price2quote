import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import db from '@/db'
import { accounts, sessions, users } from '@/db/schema'
import { env } from '@/env/server'
import { getIpAddress } from '@/lib/utils'

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const GITHUB_USERINFO_URL = 'https://api.github.com/user'
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails'
const SESSION_COOKIE_NAME = 'session_token'
const SESSION_EXPIRES_DAYS = 7

interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
  visibility: string | null
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const storedState = req.cookies.get('oauth_state')?.value

    if (!state || !storedState || state !== storedState) {
      console.error('State mismatch:', { state, storedState })
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 },
      )
    }

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        redirect_uri: env.GITHUB_REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => null)
      console.error('GitHub token error:', error)
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens' },
        { status: 400 },
      )
    }

    const tokens = await tokenResponse.json()
    const accessToken = tokens.access_token

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token received' },
        { status: 400 },
      )
    }

    // Get user info from Github
    const userResponse = await fetch(GITHUB_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (!userResponse.ok) {
      const error = await userResponse.json().catch(() => null)
      console.error('GitHub user info error:', error)
      return NextResponse.json(
        { error: 'Failed to get user info' },
        { status: 400 },
      )
    }

    const githubUser = await userResponse.json()

    // Get user's emails from Github
    const emailsResponse = await fetch(GITHUB_EMAILS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (!emailsResponse.ok) {
      const error = await emailsResponse.json().catch(() => null)
      console.error('GitHub emails error:', error)
      return NextResponse.json(
        { error: 'Failed to get user emails' },
        { status: 400 },
      )
    }

    const emails = await emailsResponse.json()
    const primaryEmail = emails.find(
      (email: GitHubEmail) => email.primary,
    )?.email

    if (!primaryEmail) {
      return NextResponse.json(
        { error: 'No primary email found in GitHub account' },
        { status: 400 },
      )
    }

    // Check if user exists with this email
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, primaryEmail))

    if (user) {
      // Check if user already has a GitHub account
      const [existingAccount] = await db
        .select()
        .from(accounts)
        .where(
          and(eq(accounts.userId, user.id), eq(accounts.provider, 'github')),
        )

      if (existingAccount) {
        // User already has a GitHub account, proceed with login
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
      const [newUser] = await db
        .insert(users)
        .values({
          email: primaryEmail,
          name: githubUser.name || githubUser.login,
          image: githubUser.avatar_url,
          emailVerified: new Date(),
          passwordHash: '',
        })
        .returning()
      user = newUser
    }

    // Update or create GitHub account link
    await db
      .insert(accounts)
      .values({
        userId: user.id,
        provider: 'github',
        providerAccountId: githubUser.id.toString(), // GitHub IDs are numbers, convert to string
        type: 'oauth',
        accessToken,
        // GitHub doesn't provide refresh tokens by default
        refreshToken: null,
        // GitHub tokens don't expire by default, set to 1 year from now
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .onConflictDoUpdate({
        target: [accounts.provider, accounts.providerAccountId],
        set: {
          accessToken,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })

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

    const response = NextResponse.redirect(new URL('/', req.url))
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    })

    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('Github callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent('Failed to process Github login')}`,
        req.url,
      ),
    )
  }
}

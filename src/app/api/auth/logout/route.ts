import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { sessions } from '@/db/schema'
import { env } from '@/env/server'

const SESSION_COOKIE_NAME = 'session_token'

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    // Delete session from DB
    await db.delete(sessions).where(eq(sessions.id, sessionToken))

    // Clear cookie
    const res = NextResponse.json({ success: true })
    res.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
      expires: new Date(0),
    })
    return res
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Server error',
        details: err instanceof Error ? err.message : err,
      },
      { status: 500 },
    )
  }
}

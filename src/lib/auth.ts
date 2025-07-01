import { cookies } from 'next/headers'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { sessions, users } from '@/db/schema'
import { SubscriptionTier } from '@/types'

export type Session = {
  id: string
  userId: string
  expiresAt: Date
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
    subscriptionTier: SubscriptionTier
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies()
  const sessionToken = (await cookieStore).get('session_token')

  if (!sessionToken) return null

  try {
    const result = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
          subscriptionTier: users.subscriptionTier,
        },
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionToken.value))
      .limit(1)

    const session = result[0]
    if (!session || new Date() > session.expiresAt) return null
    return session
  } catch (error) {
    console.error('Session validation error: ', error)
    return null
  }
}

export async function getUser() {
  const session = await getSession()
  return session?.user ?? null
}

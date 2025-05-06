'use server'

import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

import db from '@/db'
import { users } from '@/db/schema'
import { env } from '@/env/server'

export async function generateEmailVerificationToken(
  email: string,
  userId?: string,
) {
  const secret = env.AUTH_SECRET
  if (!secret)
    throw new Error('AUTH_SECRET is not set in environment variables')
  return jwt.sign(
    {
      sub: userId ?? '',
      email: email,
      type: 'email-verification',
    },
    secret,
    { expiresIn: '15m' },
  )
}

export type VerifyEmailTokenResult =
  | { success: true; message: string }
  | {
      success: false
      error: string
    }

export async function verifyEmailToken(
  token: string,
): Promise<VerifyEmailTokenResult> {
  const secret = env.AUTH_SECRET
  if (!secret)
    return {
      success: false,
      error: 'Server misconfiguration',
    }
  try {
    const decoded = jwt.verify(token, secret)
    if (!decoded || typeof decoded !== 'object') {
      return { success: false, error: 'Invalid token' }
    }
    const { email, type } = decoded as jwt.JwtPayload & {
      email?: string
      type?: string
    }
    if (type !== 'email-verification') {
      return {
        success: false,
        error: 'Invalid token type',
      }
    }
    if (!email) {
      return {
        success: false,
        error: 'Token does not contain email',
      }
    }
    const usersResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
    const user = usersResult[0]
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    if (user.emailVerified) {
      return {
        success: false,
        error: 'Email already verified',
      }
    }
    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, email))
    return { success: true, message: 'Email verified successfully' }
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err &&
      'name' in err &&
      (err as { name?: string }).name === 'TokenExpiredError'
    ) {
      return {
        success: false,
        error: 'Verification link has expired. Please request a new one.',
      }
    }
    return {
      success: false,
      error: 'Invalid or malformed token',
    }
  }
}

'use server'

import jwt from 'jsonwebtoken'

import { env } from '@/env/server'

export async function generateEmailVerificationToken(
  userId: string,
  email: string,
) {
  const secret = env.AUTH_SECRET
  if (!secret)
    throw new Error('AUTH_SECRET is not set in environment variables')
  return jwt.sign(
    {
      sub: userId,
      email: email,
      type: 'email-verification',
    },
    secret,
    { expiresIn: '15m' },
  )
}

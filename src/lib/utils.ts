import { NextRequest } from 'next/server'

import { type ClassValue, clsx } from 'clsx'
import jwt from 'jsonwebtoken'
import { twMerge } from 'tailwind-merge'

import { env } from '@/env/server'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getIpAddress(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  return ip.split(',')[0].trim()
}

export async function getLocation(ip: string) {
  if (ip === '::ffff:127.0.0.1') {
    return 'Localhost'
  }
  const response = await fetch(`https://ipapi.co/${ip}/json/`)
  const data = await response.json()
  console.log(data)
  return data.city
}

/**
 * Generates a signed email verification token with a 15-minute expiry.
 * @param user - The user object (must include id and email)
 * @returns The signed JWT token as a string
 * @note Uses env.JWT_SECRET (or process.env.JWT_SECRET as fallback) for signing
 */
export function generateEmailVerificationToken(user: {
  id: string
  email: string
}) {
  const secret = env.AUTH_SECRET
  if (!secret)
    throw new Error('AUTH_SECRET is not set in environment variables')
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      type: 'email-verification',
    },
    secret,
    { expiresIn: '15m' },
  )
}

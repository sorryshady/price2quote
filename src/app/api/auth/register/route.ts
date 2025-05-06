import { NextRequest, NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db'
import { accounts, users } from '@/db/schema'
import { env } from '@/env/server'
import { getIpAddress, getLocation } from '@/lib/utils'

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ip = getIpAddress(req)
    const location = await getLocation(ip)
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 },
      )
    }
    const { name, email, password } = parsed.data

    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email))
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 },
      )
    }

    // Hash password with pepper (AUTH_SECRET)
    const pepper = env.AUTH_SECRET
    const passwordHash = await bcrypt.hash(password + pepper, 12)

    // Insert user
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning()

    // Insert account (credentials type)
    await db.insert(accounts).values({
      userId: user.id,
      provider: 'credentials',
      providerAccountId: user.id,
      type: 'credentials',
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, ip, location },
    })
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

import { NextRequest, NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { verifyForgotPasswordToken } from '@/app/server-actions/action'
import db from '@/db'
import { users } from '@/db/schema'
import { env } from '@/env/server'

const resetPasswordSchema = z.object({
  password: z.string().min(8),
  token: z.string(),
})
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 },
      )
    }
    const { password, token } = parsed.data
    const isValidToken = await verifyForgotPasswordToken(token)
    if (!isValidToken.success) {
      return NextResponse.json({ error: isValidToken.error }, { status: 400 })
    }
    const {
      user: { email },
    } = isValidToken
    const [user] = await db.select().from(users).where(eq(users.email, email))
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const pepper = env.AUTH_SECRET
    const isSamePassword = await bcrypt.compare(
      password + pepper,
      user.passwordHash,
    )
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password cannot be the same as the old password' },
        { status: 400 },
      )
    }
    const hashedPassword = await bcrypt.hash(password + pepper, 12)
    await db
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.id, user.id))

    return NextResponse.json(
      { message: 'Password reset successful' },
      { status: 200 },
    )
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

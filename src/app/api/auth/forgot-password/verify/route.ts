import { NextRequest, NextResponse } from 'next/server'

import { verifyForgotPasswordToken } from '@/app/server-actions/action'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token } = body
  const result = await verifyForgotPasswordToken(token)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json(
    { success: true, user: result.user },
    { status: 200 },
  )
}

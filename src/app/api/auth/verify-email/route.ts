import { NextRequest, NextResponse } from 'next/server'

import { verifyEmailToken } from '@/app/server-actions'

export const POST = async (req: NextRequest) => {
  const body = await req.json()
  const { token } = body
  const result = await verifyEmailToken(token)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json({ message: result.message }, { status: 200 })
}

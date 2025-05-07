import { NextResponse } from 'next/server'

import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()

  if (!user) {
    return new NextResponse(null, { status: 401 })
  }

  return NextResponse.json({ user })
}

import { NextResponse } from 'next/server'

import { getUser } from '@/lib/auth'
import { checkExpiredSubscriptions } from '@/lib/dodo-payments'

export async function GET() {
  const user = await getUser()

  if (!user) {
    return new NextResponse(null, { status: 401 })
  }

  // Check for expired subscriptions in the background
  // This ensures users get downgraded when they check their auth status
  checkExpiredSubscriptions().catch((error) => {
    console.error('Background expired subscription check failed:', error)
  })

  return NextResponse.json({ user })
}

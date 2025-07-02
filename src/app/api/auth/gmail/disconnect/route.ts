import { NextRequest, NextResponse } from 'next/server'

import { disconnectGmailAction } from '@/app/server-actions'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId } = body

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 },
      )
    }

    const result = await disconnectGmailAction(companyId)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Gmail disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Gmail' },
      { status: 500 },
    )
  }
}

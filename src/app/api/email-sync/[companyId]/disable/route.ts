import { NextRequest, NextResponse } from 'next/server'

import { disableEmailSyncAction } from '@/app/server-actions/email-sync'
import { getSession } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = await params
    const result = await disableEmailSyncAction(companyId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sync disabled',
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Error disabling email sync:', error)
    return NextResponse.json(
      { error: 'Failed to disable email sync' },
      { status: 500 },
    )
  }
}

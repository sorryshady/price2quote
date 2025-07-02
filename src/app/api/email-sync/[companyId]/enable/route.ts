import { NextResponse } from 'next/server'

import { enableEmailSyncAction } from '@/app/server-actions/email-sync'
import { getSession } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: { companyId: string } },
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = params
    const result = await enableEmailSyncAction(companyId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sync enabled',
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Error enabling email sync:', error)
    return NextResponse.json(
      { error: 'Failed to enable email sync' },
      { status: 500 },
    )
  }
}

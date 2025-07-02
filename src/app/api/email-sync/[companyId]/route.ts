import { NextRequest, NextResponse } from 'next/server'

import { getEmailSyncStatusAction } from '@/app/server-actions/email-sync'
import { getSession } from '@/lib/auth'
import { EmailSyncService } from '@/lib/email-sync'

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } },
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = params
    const syncService = new EmailSyncService()
    await syncService.syncCompanyEmails(companyId)

    return NextResponse.json({
      success: true,
      message: `Email sync completed for company ${companyId}`,
    })
  } catch (error) {
    console.error('Error in company email sync API:', error)
    return NextResponse.json(
      { error: 'Failed to sync company emails' },
      { status: 500 },
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } },
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = params
    const result = await getEmailSyncStatusAction(companyId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        status: result.status,
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Error getting company sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get company sync status' },
      { status: 500 },
    )
  }
}

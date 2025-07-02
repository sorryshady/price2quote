import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { EmailSyncService } from '@/lib/email-sync'

export async function POST() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const syncService = new EmailSyncService()
    await syncService.syncAllCompanies()

    return NextResponse.json({
      success: true,
      message: 'Email sync completed for all companies',
    })
  } catch (error) {
    console.error('Error in email sync API:', error)
    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Implement global sync status
    // This would aggregate sync status from all companies

    return NextResponse.json({
      success: true,
      status: 'active',
      lastGlobalSync: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting global sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 },
    )
  }
}

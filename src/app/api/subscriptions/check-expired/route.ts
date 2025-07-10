import { NextResponse } from 'next/server'

import { checkExpiredSubscriptions } from '@/lib/dodo-payments'

export async function POST() {
  try {
    const result = await checkExpiredSubscriptions()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Processed ${result.processedCount} expired subscriptions`,
        processedCount: result.processedCount,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Error in check-expired endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 },
    )
  }
}

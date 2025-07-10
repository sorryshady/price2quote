import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { subscriptions } from '@/db/schema'
import { getUser } from '@/lib/auth'
import { dodoPayments } from '@/lib/dodo-payments'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscriptionId, reason } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 },
      )
    }

    // Verify the subscription belongs to the user
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1)

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 },
      )
    }

    if (subscription.dodoSubscriptionId !== subscriptionId) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 403 },
      )
    }

    // Cancel subscription with Dodo Payments
    const cancelResponse = await dodoPayments.subscriptions.update(
      subscriptionId,
      {
        status: 'cancelled',
        metadata: {},
      },
    )
    console.log('Dodo cancellation response:', cancelResponse)

    // Update subscription status in our database
    // BUT keep the user on pro tier until the current period ends
    await db
      .update(subscriptions)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))

    // NOTE: We do NOT downgrade the user's subscriptionTier here
    // The user keeps pro access until currentPeriodEnd
    // The subscription will be handled by webhooks or a cron job later

    return NextResponse.json({
      success: true,
      message:
        'Subscription cancelled successfully. You will retain Pro access until the end of your current billing period.',
      data: {
        subscriptionId,
        status: 'cancelled',
        reason: reason || 'User requested cancellation',
        accessExpiresAt: subscription.currentPeriodEnd,
      },
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

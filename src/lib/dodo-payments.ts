import DodoPayments from 'dodopayments'
import { and, eq, lt } from 'drizzle-orm'

import db from '@/db'
import { subscriptions, users } from '@/db/schema'
import { env } from '@/env/server'
import type { DodoWebhookPayload, UpdateSubscriptionResult } from '@/types'

export const dodoPayments = new DodoPayments({
  bearerToken: env.DODO_PAYMENTS_API_KEY,
  environment: env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
})

// Helper function to update user subscription tier based on subscription status
export async function updateUserSubscriptionTier(
  userId: string,
  subscriptionStatus: string,
) {
  // Determine subscription tier based on status
  const subscriptionTier = subscriptionStatus === 'active' ? 'pro' : 'free'

  // Update user subscription tier
  await db
    .update(users)
    .set({
      subscriptionTier,
    })
    .where(eq(users.id, userId))

  console.log(
    `Updated user ${userId} subscription tier to: ${subscriptionTier}`,
  )
  return subscriptionTier
}

// Check for expired cancelled subscriptions and downgrade users
export async function checkExpiredSubscriptions() {
  try {
    const now = new Date()

    // Find all cancelled subscriptions where the current period has ended
    // and user is still on pro tier
    const expiredSubscriptions = await db
      .select({
        userId: subscriptions.userId,
        subscriptionId: subscriptions.id,
        dodoSubscriptionId: subscriptions.dodoSubscriptionId,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        userTier: users.subscriptionTier,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(
        and(
          eq(subscriptions.status, 'cancelled'),
          lt(subscriptions.currentPeriodEnd, now),
          eq(users.subscriptionTier, 'pro'),
        ),
      )

    console.log(
      `Found ${expiredSubscriptions.length} expired subscriptions to process`,
    )

    // Downgrade each expired user
    for (const subscription of expiredSubscriptions) {
      await updateUserSubscriptionTier(subscription.userId, 'cancelled')
      console.log(
        `Downgraded user ${subscription.userId} from pro to free (subscription expired: ${subscription.currentPeriodEnd})`,
      )
    }

    return {
      success: true,
      processedCount: expiredSubscriptions.length,
    }
  } catch (error) {
    console.error('Error checking expired subscriptions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Handle subscription creation/activation from webhook
export async function handleSubscriptionWebhook(
  email: string,
  payload: DodoWebhookPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      throw new Error(`User not found with email: ${email}`)
    }

    // Extract subscription data
    const subscriptionData = {
      id: payload.data.subscription_id || payload.data.id || '',
      status: payload.data.status || 'active',
      current_period_start:
        payload.data.current_period_start || Math.floor(Date.now() / 1000),
      current_period_end:
        payload.data.current_period_end ||
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    }

    if (!subscriptionData.id) {
      throw new Error('Missing subscription ID in webhook payload')
    }

    // Try to get more accurate billing period from Dodo API
    try {
      const subscriptionDetails = await dodoPayments.subscriptions.retrieve(
        subscriptionData.id,
      )
      // Use available properties from the subscription response
      console.log('Retrieved subscription details:', subscriptionDetails)
      // Note: Billing periods will use defaults if not available in API response
    } catch (apiError) {
      console.warn(
        'Could not fetch subscription details from Dodo API, using defaults:',
        apiError,
      )
    }

    // Create or update subscription record
    await db
      .insert(subscriptions)
      .values({
        userId: user.id,
        dodoSubscriptionId: subscriptionData.id,
        dodoCustomerId:
          payload.data.customer?.customer_id ||
          payload.data.customer?.id ||
          email,
        status: subscriptionData.status,
        currentPeriodStart: new Date(
          subscriptionData.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
      })
      .onConflictDoUpdate({
        target: subscriptions.dodoSubscriptionId,
        set: {
          status: subscriptionData.status,
          currentPeriodStart: new Date(
            subscriptionData.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(
            subscriptionData.current_period_end * 1000,
          ),
          updatedAt: new Date(),
        },
      })

    // Update user subscription tier
    await updateUserSubscriptionTier(user.id, subscriptionData.status)

    console.log(
      `Successfully processed subscription webhook for user: ${email}`,
    )
    return { success: true }
  } catch (error) {
    console.error('Error handling subscription webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Cancel subscription and update user status
export async function cancelUserSubscription(
  email: string,
  subscriptionId: string,
): Promise<UpdateSubscriptionResult> {
  try {
    // Find the user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      return {
        success: false,
        error: {
          message: 'User not found',
          status: 404,
        },
      }
    }

    // Update subscription status in our database
    await db
      .update(subscriptions)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.dodoSubscriptionId, subscriptionId))

    // Update user subscription tier back to free
    await updateUserSubscriptionTier(user.id, 'cancelled')

    return { success: true }
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return {
      success: false,
      error: {
        message: 'Internal server error',
        status: 500,
      },
    }
  }
}

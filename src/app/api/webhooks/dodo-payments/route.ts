import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { Webhook } from 'standardwebhooks'

import db from '@/db'
import { payments } from '@/db/schema'
import { env } from '@/env/server'
import type { DodoWebhookPayload } from '@/types'

const webhook = new Webhook(env.DODO_PAYMENTS_WEBHOOK_SECRET || '')

/**
 * COMPREHENSIVE DODO PAYMENTS WEBHOOK HANDLER
 *
 * This webhook handler ensures proper synchronization between Dodo Payments
 * and our application's user subscription system.
 *
 * KEY FEATURES:
 * 1. **User Subscription Tier Updates**: Automatically updates user.subscriptionTier
 *    in the database when subscription status changes (active = 'pro', cancelled = 'free')
 *
 * 2. **Database Synchronization**: Maintains subscription records in our subscriptions table
 *    with current status, billing periods, and Dodo subscription IDs
 *
 * 3. **Payment Tracking**: Records all payment attempts (successful and failed)
 *    in our payments table for billing history
 *
 * 4. **Real-time Auth State Updates**: When subscription status changes, the user's
 *    subscription tier is immediately updated, which triggers:
 *    - Updated subscription limits (quotes, companies, revisions)
 *    - UI changes reflecting new subscription status
 *    - Access to pro features
 *
 * 5. **Payment Success Processing**: When payments succeed, ensures user subscription
 *    tier is set to 'pro' even if other webhook events were missed
 *
 * WEBHOOK EVENTS HANDLED:
 * - customer.subscription.created
 * - checkout.session.completed
 * - subscription.active
 * - subscription.renewed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - payment.succeeded
 * - invoice.payment_failed
 *
 * INTEGRATION POINTS:
 * - Updates users.subscriptionTier which affects @/hooks/use-auth
 * - Updates subscription records used by @/hooks/use-subscription-limits
 * - Records payments displayed in billing pages
 * - Triggers real-time subscription status updates throughout the app
 */

// Use the imported type from @/types

export async function POST(request: NextRequest) {
  const headersList = await headers()

  try {
    const rawBody = await request.text()
    console.log('Received Dodo Payments webhook:', rawBody)

    const webhookHeaders = {
      'webhook-id': headersList.get('webhook-id') || '',
      'webhook-signature': headersList.get('webhook-signature') || '',
      'webhook-timestamp': headersList.get('webhook-timestamp') || '',
    }

    // Verify webhook signature
    await webhook.verify(rawBody, webhookHeaders)
    console.log('Webhook verified successfully')

    const payload: DodoWebhookPayload = JSON.parse(rawBody)
    console.log('Webhook payload:', JSON.stringify(payload, null, 2))

    // Handle different webhook events
    switch (payload.type) {
      case 'customer.subscription.created':
      case 'checkout.session.completed':
      case 'subscription.active':
      case 'subscription.renewed':
        await handleSubscriptionCreated(payload)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(payload)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(payload)
        break

      case 'invoice.payment_succeeded':
      case 'payment.succeeded':
        await handlePaymentSucceeded(payload)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(payload)
        break

      default:
        console.log(`Unhandled webhook event type: ${payload.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Dodo Payments webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 },
    )
  }
}

async function handleSubscriptionCreated(payload: DodoWebhookPayload) {
  try {
    const customerData = payload.data.customer

    if (!customerData?.email) {
      throw new Error('Missing customer email')
    }

    // Use the new helper function that handles both DB updates and user tier updates
    const { handleSubscriptionWebhook } = await import('@/lib/dodo-payments')
    const result = await handleSubscriptionWebhook(customerData.email, payload)

    if (!result.success) {
      throw new Error(result.error || 'Failed to handle subscription webhook')
    }

    console.log('Subscription created/updated successfully')
  } catch (error) {
    console.error('Error handling subscription created:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(payload: DodoWebhookPayload) {
  try {
    const customerData = payload.data.customer

    if (!customerData?.email) {
      throw new Error('Missing customer email')
    }

    // Use the same helper function to handle updates and user tier changes
    const { handleSubscriptionWebhook } = await import('@/lib/dodo-payments')
    const result = await handleSubscriptionWebhook(customerData.email, payload)

    if (!result.success) {
      throw new Error(
        result.error || 'Failed to handle subscription update webhook',
      )
    }

    console.log('Subscription updated successfully')
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(payload: DodoWebhookPayload) {
  try {
    const customerData = payload.data.customer

    if (!customerData?.email) {
      throw new Error('Missing customer email')
    }

    const subscriptionId = payload.data.subscription_id || payload.data.id
    if (!subscriptionId) {
      throw new Error('Missing subscription ID')
    }

    // Use the helper function to handle cancellation and user tier update
    const { cancelUserSubscription } = await import('@/lib/dodo-payments')
    const result = await cancelUserSubscription(
      customerData.email,
      subscriptionId,
    )

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to cancel subscription')
    }

    console.log('Subscription cancelled successfully')
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
    throw error
  }
}

async function handlePaymentSucceeded(payload: DodoWebhookPayload) {
  try {
    const customerData = payload.data.customer

    if (!customerData?.email) {
      throw new Error('Missing customer email')
    }

    // Get user from email to get user ID
    const user = await getUserByEmail(customerData.email)
    if (!user) {
      throw new Error('User not found')
    }

    // For payment.succeeded events, the payment data is in the root data object
    const paymentData = payload.data

    // Create payment record using payment data
    await db
      .insert(payments)
      .values({
        userId: user.id,
        dodoPaymentId:
          paymentData.payment_id || paymentData.id || `pay_${Date.now()}`,
        dodoSubscriptionId: paymentData.subscription_id || null,
        amount: paymentData.total_amount || paymentData.amount || 0,
        currency: paymentData.currency || 'USD',
        status: 'succeeded',
        paymentMethod: paymentData.payment_method || null,
        paidAt: paymentData.created_at
          ? new Date(paymentData.created_at)
          : new Date(),
      })
      .onConflictDoNothing()

    // If this is a subscription payment, ensure user subscription tier is updated
    if (paymentData.subscription_id) {
      const { handleSubscriptionWebhook } = await import('@/lib/dodo-payments')
      const subscriptionPayload = {
        ...payload,
        data: {
          ...payload.data,
          subscription_id: paymentData.subscription_id,
          status: 'active', // Payment succeeded means subscription is active
          // Add current time as period for billing cycle
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
        },
      }

      const result = await handleSubscriptionWebhook(
        customerData.email,
        subscriptionPayload,
      )
      if (!result.success) {
        console.warn(
          'Failed to update user subscription tier after payment:',
          result.error,
        )
      }
    }

    console.log('Payment succeeded processed successfully')
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
    throw error
  }
}

async function handlePaymentFailed(payload: DodoWebhookPayload) {
  try {
    const customerData = payload.data.customer

    if (!customerData?.email) {
      throw new Error('Missing customer email')
    }

    // Get user from email to get user ID
    const user = await getUserByEmail(customerData.email)
    if (!user) {
      throw new Error('User not found')
    }

    const paymentData = payload.data

    // Create payment record with failed status
    await db
      .insert(payments)
      .values({
        userId: user.id,
        dodoPaymentId:
          paymentData.payment_id || paymentData.id || `pay_${Date.now()}`,
        dodoSubscriptionId: paymentData.subscription_id || null,
        amount: paymentData.amount || 0,
        currency: paymentData.currency || 'USD',
        status: 'failed',
        paymentMethod: paymentData.payment_method || null,
        paidAt: paymentData.created_at
          ? new Date(paymentData.created_at)
          : new Date(),
      })
      .onConflictDoNothing()

    console.log('Payment failed processed successfully')
  } catch (error) {
    console.error('Error handling payment failed:', error)
    throw error
  }
}

// Helper function to get user by email
async function getUserByEmail(email: string) {
  const { users } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  return user || null
}

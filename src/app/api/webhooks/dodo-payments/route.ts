import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'
import { Webhook } from 'standardwebhooks'

import db from '@/db'
import { invoices, subscriptions, users } from '@/db/schema'
import { env } from '@/env/server'

const webhook = new Webhook(env.DODO_PAYMENTS_WEBHOOK_SECRET || '')

interface DodoWebhookPayload {
  type: string
  data: {
    subscription?: {
      id: string
      subscription_id?: string
      customer_id?: string
      status: string
      current_period_start: number
      current_period_end: number
    }
    invoice?: {
      id: string
      subscription_id: string
      amount: number
      currency?: string
      status: string
      paid_at?: number
      invoice_pdf?: string
    }
    customer?: {
      id?: string
      email: string
      name?: string
    }
    // Fallback properties that might be at root level
    id?: string
    subscription_id?: string
    customer_id?: string
    status?: string
    current_period_start?: number
    current_period_end?: number
  }
}

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
        await handleSubscriptionCreated(payload)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(payload)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(payload)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(payload)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(payload)
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
    // Extract subscription data from nested structure or root level
    const subscriptionData = payload.data.subscription || {
      id: payload.data.id || '',
      subscription_id: payload.data.subscription_id || '',
      customer_id: payload.data.customer_id || payload.data.customer?.id || '',
      status: payload.data.status || 'active',
      current_period_start: payload.data.current_period_start || 0,
      current_period_end: payload.data.current_period_end || 0,
    }

    const customerData = payload.data.customer

    if (!customerData?.email) {
      throw new Error('Missing customer email')
    }

    // Find the user by email to get their UUID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, customerData.email))
      .limit(1)

    if (!user) {
      throw new Error(`User not found with email: ${customerData.email}`)
    }

    // Create or update subscription record
    await db
      .insert(subscriptions)
      .values({
        userId: user.id,
        dodoSubscriptionId:
          subscriptionData.id || subscriptionData.subscription_id || '',
        dodoCustomerId:
          subscriptionData.customer_id || customerData.id || customerData.email,
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

    console.log('Subscription created/updated successfully')
  } catch (error) {
    console.error('Error handling subscription created:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(payload: DodoWebhookPayload) {
  try {
    // Extract subscription data from nested structure or root level
    const subscriptionData = payload.data.subscription || {
      id: payload.data.id || '',
      subscription_id: payload.data.subscription_id || '',
      status: payload.data.status || '',
      current_period_start: payload.data.current_period_start || 0,
      current_period_end: payload.data.current_period_end || 0,
    }

    if (!subscriptionData.id && !subscriptionData.subscription_id) {
      throw new Error('Missing subscription ID')
    }

    await db
      .update(subscriptions)
      .set({
        status: subscriptionData.status,
        currentPeriodStart: new Date(
          subscriptionData.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(
        eq(
          subscriptions.dodoSubscriptionId,
          subscriptionData.id || subscriptionData.subscription_id || '',
        ),
      )

    console.log('Subscription updated successfully')
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(payload: DodoWebhookPayload) {
  try {
    // Extract subscription data from nested structure or root level
    const subscriptionData = payload.data.subscription || {
      id: payload.data.id || '',
      subscription_id: payload.data.subscription_id || '',
    }

    if (!subscriptionData.id && !subscriptionData.subscription_id) {
      throw new Error('Missing subscription ID')
    }

    await db
      .update(subscriptions)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(
        eq(
          subscriptions.dodoSubscriptionId,
          subscriptionData.id || subscriptionData.subscription_id || '',
        ),
      )

    console.log('Subscription cancelled successfully')
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
    throw error
  }
}

async function handleInvoicePaymentSucceeded(payload: DodoWebhookPayload) {
  try {
    const invoiceData = payload.data.invoice

    if (!invoiceData) {
      throw new Error('Missing invoice data')
    }

    // Create invoice record
    await db
      .insert(invoices)
      .values({
        dodoInvoiceId: invoiceData.id,
        subscriptionId: invoiceData.subscription_id,
        amount: invoiceData.amount,
        currency: invoiceData.currency || 'USD',
        status: 'paid',
        paidAt: invoiceData.paid_at
          ? new Date(invoiceData.paid_at * 1000)
          : new Date(),
        invoicePdfUrl: invoiceData.invoice_pdf,
      })
      .onConflictDoNothing()

    console.log('Invoice payment succeeded processed successfully')
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
    throw error
  }
}

async function handleInvoicePaymentFailed(payload: DodoWebhookPayload) {
  try {
    const invoiceData = payload.data.invoice

    if (!invoiceData) {
      throw new Error('Missing invoice data')
    }

    // Create or update invoice record with failed status
    await db
      .insert(invoices)
      .values({
        dodoInvoiceId: invoiceData.id,
        subscriptionId: invoiceData.subscription_id,
        amount: invoiceData.amount,
        currency: invoiceData.currency || 'USD',
        status: 'failed',
      })
      .onConflictDoUpdate({
        target: invoices.dodoInvoiceId,
        set: {
          status: 'failed',
        },
      })

    console.log('Invoice payment failed processed successfully')
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
    throw error
  }
}

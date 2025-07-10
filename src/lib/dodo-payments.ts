import DodoPayments from 'dodopayments'
import { CountryCode } from 'dodopayments/resources/misc.mjs'
import { Webhook } from 'standardwebhooks'

import { env } from '@/env/server'

// Types for Dodo Payments API
export interface DodoCheckoutSession {
  billing: {
    city: string
    country: string
    state: string
    street: string
    zipcode: string
  }
  customer: {
    email: string
    name: string
    phone_number?: string
  }
  payment_link: boolean
  product_id: string
  quantity: number
  return_url: string
}

export interface DodoCheckoutResponse {
  payment_link: string
  subscription_id: string
  customer_id: string
}

export interface DodoWebhookEvent {
  type: string
  data: {
    subscription?: {
      id: string
      customer_id: string
      status: string
      current_period_start: string
      current_period_end: string
    }
    invoice?: {
      id: string
      subscription_id: string
      amount: number
      currency: string
      status: string
      paid_at?: string
      invoice_pdf?: string
    }
    customer?: {
      id: string
      email: string
      name: string
    }
  }
}

class DodoPaymentsClient {
  private client: DodoPayments
  private webhookSecret: string

  constructor() {
    this.client = new DodoPayments({
      bearerToken: env.DODO_PAYMENTS_API_KEY || '',
      environment: env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
    })
    this.webhookSecret = env.DODO_PAYMENTS_WEBHOOK_SECRET || ''
  }

  /**
   * Create a checkout session for subscription upgrade
   */
  async createCheckoutSession(
    sessionData: DodoCheckoutSession,
  ): Promise<DodoCheckoutResponse> {
    try {
      const subscription = await this.client.subscriptions.create({
        billing: {
          city: sessionData.billing.city,
          country: sessionData.billing.country as CountryCode,
          state: sessionData.billing.state,
          street: sessionData.billing.street,
          zipcode: sessionData.billing.zipcode,
        },
        customer: {
          email: sessionData.customer.email,
          name: sessionData.customer.name,
          phone_number: sessionData.customer.phone_number,
        },
        payment_link: sessionData.payment_link,
        product_id: sessionData.product_id,
        quantity: sessionData.quantity,
        return_url: sessionData.return_url,
      })

      return {
        payment_link: subscription.payment_link || '',
        subscription_id: subscription.subscription_id || '',
        customer_id: subscription.customer?.email || '',
      }
    } catch (error) {
      console.error('Dodo Payments SDK error:', error)
      throw new Error(
        `Dodo Payments API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Verify webhook signature using standardwebhooks
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string,
    webhookId: string,
  ): boolean {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    try {
      // Using the same standardwebhooks library as in the official example
      const webhook = new Webhook(this.webhookSecret)

      const webhookHeaders = {
        'webhook-id': webhookId,
        'webhook-signature': signature,
        'webhook-timestamp': timestamp,
      }

      webhook.verify(payload, webhookHeaders)
      return true
    } catch (error) {
      console.error('Webhook verification failed:', error)
      return false
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: string): DodoWebhookEvent {
    try {
      return JSON.parse(payload)
    } catch {
      throw new Error('Invalid webhook payload')
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string) {
    try {
      return await this.client.subscriptions.retrieve(subscriptionId)
    } catch (error) {
      throw new Error(
        `Failed to fetch subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Cancel subscription using update method as shown in official example
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      return await this.client.subscriptions.update(subscriptionId, {
        status: 'cancelled',
        metadata: {},
      })
    } catch (error) {
      throw new Error(
        `Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get supported countries
   */
  async getSupportedCountries() {
    try {
      return await this.client.misc.listSupportedCountries()
    } catch (error) {
      throw new Error(
        `Failed to fetch supported countries: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}

// Export singleton instance
export const dodoPayments = new DodoPaymentsClient()

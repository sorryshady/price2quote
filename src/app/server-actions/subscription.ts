'use server'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { invoices, subscriptions } from '@/db/schema'
import { getUser } from '@/lib/auth'
import {
  canCreateQuoteRevision,
  canUserCreateCompany,
  canUserCreateQuote,
  getCurrentCompanies,
  getCurrentMonthOriginalQuotes,
  getQuoteRevisionCount,
  getUpgradeMessage,
} from '@/lib/subscription'

// New subscription management actions
export async function getUserSubscriptionAction() {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1)

    return { subscription }
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return { error: 'Failed to fetch subscription' }
  }
}

export async function getUserInvoicesAction() {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get user's subscription first
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1)

    if (!subscription) {
      return { invoices: [] }
    }

    // Get all invoices for this subscription
    const userInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.subscriptionId, subscription.id))
      .orderBy(invoices.createdAt)

    return { invoices: userInvoices }
  } catch (error) {
    console.error('Error fetching user invoices:', error)
    return { error: 'Failed to fetch invoices' }
  }
}

export async function getSubscriptionWithInvoicesAction() {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1)

    if (!subscription) {
      return {
        subscription: null,
        invoices: [],
        subscriptionTier: user.subscriptionTier,
      }
    }

    // Get invoices for this subscription
    const userInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.subscriptionId, subscription.id))
      .orderBy(invoices.createdAt)

    return {
      subscription,
      invoices: userInvoices,
      subscriptionTier: user.subscriptionTier,
    }
  } catch (error) {
    console.error('Error fetching subscription with invoices:', error)
    return { error: 'Failed to fetch subscription data' }
  }
}

// Legacy subscription limit actions (kept for backward compatibility)
export async function checkQuoteLimitAction(
  userId: string,
  userTier: 'free' | 'pro',
) {
  try {
    // Default to 'free' if userTier is invalid
    const tier = userTier === 'free' || userTier === 'pro' ? userTier : 'free'
    const canCreate = await canUserCreateQuote(userId, tier)
    const currentQuotes = await getCurrentMonthOriginalQuotes(userId)
    const upgradeMessage = getUpgradeMessage('quotes', tier)

    return {
      success: true,
      canCreate,
      currentQuotes,
      upgradeMessage,
    }
  } catch (error) {
    console.error('Error checking quote limit:', error)
    return {
      success: false,
      error: 'Failed to check quote limit',
    }
  }
}

export async function checkCompanyLimitAction(
  userId: string,
  userTier: 'free' | 'pro',
) {
  try {
    // Default to 'free' if userTier is invalid
    const tier = userTier === 'free' || userTier === 'pro' ? userTier : 'free'
    const canCreate = await canUserCreateCompany(userId, tier)
    const currentCompanies = await getCurrentCompanies(userId)
    const upgradeMessage = getUpgradeMessage('companies', tier)

    return {
      success: true,
      canCreate,
      currentCompanies,
      upgradeMessage,
    }
  } catch (error) {
    console.error('Error checking company limit:', error)
    return {
      success: false,
      error: 'Failed to check company limit',
    }
  }
}

export async function checkRevisionLimitAction(
  quoteId: string,
  userTier: 'free' | 'pro',
) {
  try {
    // Default to 'free' if userTier is invalid
    const tier = userTier === 'free' || userTier === 'pro' ? userTier : 'free'
    const canCreate = await canCreateQuoteRevision(quoteId, tier)
    const currentRevisions = await getQuoteRevisionCount(quoteId)
    const upgradeMessage =
      tier === 'free' ? 'Upgrade to Pro for unlimited revisions' : ''

    return {
      success: true,
      canCreate,
      currentRevisions,
      upgradeMessage,
    }
  } catch (error) {
    console.error('Error checking revision limit:', error)
    return {
      success: false,
      error: 'Failed to check revision limit',
    }
  }
}

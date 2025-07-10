'use server'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { payments, subscriptions } from '@/db/schema'
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

export async function getUserPaymentsAction() {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get all payments for this user
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, user.id))
      .orderBy(payments.paidAt)

    return { payments: userPayments }
  } catch (error) {
    console.error('Error fetching user payments:', error)
    return { error: 'Failed to fetch payments' }
  }
}

export async function getSubscriptionWithPaymentsAction() {
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
        payments: [],
        subscriptionTier: user.subscriptionTier,
      }
    }

    // Get payments for this user
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, user.id))
      .orderBy(payments.paidAt)

    return {
      subscription,
      payments: userPayments,
      subscriptionTier: user.subscriptionTier,
    }
  } catch (error) {
    console.error('Error fetching subscription with payments:', error)
    return { error: 'Failed to fetch subscription data' }
  }
}

// Legacy function names for backward compatibility
export async function getUserInvoicesAction() {
  return getUserPaymentsAction()
}

export async function getSubscriptionWithInvoicesAction() {
  return getSubscriptionWithPaymentsAction()
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

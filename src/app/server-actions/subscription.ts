'use server'

import {
  canCreateQuoteRevision,
  canUserCreateCompany,
  canUserCreateQuote,
  getCurrentCompanies,
  getCurrentMonthQuotes,
  getQuoteRevisionCount,
  getUpgradeMessage,
} from '@/lib/subscription'

export async function checkQuoteLimitAction(
  userId: string,
  userTier: 'free' | 'pro',
) {
  try {
    // Default to 'free' if userTier is invalid
    const tier = userTier === 'free' || userTier === 'pro' ? userTier : 'free'
    const canCreate = await canUserCreateQuote(userId, tier)
    const currentQuotes = await getCurrentMonthQuotes(userId)
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
  originalQuoteId: string,
  userTier: 'free' | 'pro',
) {
  try {
    // Default to 'free' if userTier is invalid
    const tier = userTier === 'free' || userTier === 'pro' ? userTier : 'free'
    const canCreate = await canCreateQuoteRevision(originalQuoteId, tier)
    const currentRevisions = await getQuoteRevisionCount(originalQuoteId)
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

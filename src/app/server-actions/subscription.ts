'use server'

import {
  canUserCreateCompany,
  canUserCreateQuote,
  getCurrentCompanies,
  getCurrentMonthQuotes,
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

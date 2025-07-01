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
    const canCreate = await canUserCreateQuote(userId, userTier)
    const currentQuotes = await getCurrentMonthQuotes(userId)
    const upgradeMessage = getUpgradeMessage('quotes', userTier)

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
    const canCreate = await canUserCreateCompany(userId, userTier)
    const currentCompanies = await getCurrentCompanies(userId)
    const upgradeMessage = getUpgradeMessage('companies', userTier)

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

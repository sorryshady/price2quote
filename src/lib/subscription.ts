import type { SubscriptionFeatures, SubscriptionTier } from '@/types'

export const subscriptionFeatures: SubscriptionFeatures = {
  free: {
    maxQuotesPerMonth: 3,
    maxCompanies: 1,
    features: [
      '3 free quotes per month',
      '1 company',
      'Email support',
    ],
  },
  pro: {
    maxQuotesPerMonth: -1, // Unlimited
    maxCompanies: 5,
    features: [
      'Unlimited quotes',
      'Up to 5 companies',
      'Priority support',
    ],
  },
}

export function canCreateQuote(userTier: SubscriptionTier, currentQuotesThisMonth: number): boolean {
  const maxQuotes = subscriptionFeatures[userTier].maxQuotesPerMonth
  return maxQuotes === -1 || currentQuotesThisMonth < maxQuotes
}

export function canCreateCompany(userTier: SubscriptionTier, currentCompanies: number): boolean {
  const maxCompanies = subscriptionFeatures[userTier].maxCompanies
  return maxCompanies === -1 || currentCompanies < maxCompanies
}

export function getSubscriptionFeatures(tier: SubscriptionTier) {
  return subscriptionFeatures[tier]
} 
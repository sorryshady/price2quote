import type { SubscriptionFeatures, SubscriptionTier } from '@/types'

export const subscriptionFeatures: SubscriptionFeatures = {
  free: {
    maxQuotesPerMonth: 3,
    maxCompanies: 1,
    maxRevisionsPerQuote: 2,
    features: [
      '3 free quotes per month',
      '1 company',
      '2 revisions per quote family',
      'Email support',
    ],
  },
  pro: {
    maxQuotesPerMonth: -1, // Unlimited
    maxCompanies: 5,
    maxRevisionsPerQuote: -1, // Unlimited
    features: [
      'Unlimited quotes',
      'Up to 5 companies',
      'Unlimited revisions',
      'Priority support',
    ],
  },
}

export function canCreateQuote(
  userTier: SubscriptionTier,
  currentQuotesThisMonth: number,
): boolean {
  // Default to 'free' if userTier is invalid
  const tier = userTier && subscriptionFeatures[userTier] ? userTier : 'free'
  const maxQuotes = subscriptionFeatures[tier].maxQuotesPerMonth
  return maxQuotes === -1 || currentQuotesThisMonth < maxQuotes
}

export function canCreateCompany(
  userTier: SubscriptionTier,
  currentCompanies: number,
): boolean {
  // Default to 'free' if userTier is invalid
  const tier = userTier && subscriptionFeatures[userTier] ? userTier : 'free'
  const maxCompanies = subscriptionFeatures[tier].maxCompanies
  return maxCompanies === -1 || currentCompanies < maxCompanies
}

export function getSubscriptionFeatures(tier: SubscriptionTier) {
  // Default to 'free' if tier is invalid
  const validTier = tier && subscriptionFeatures[tier] ? tier : 'free'
  return subscriptionFeatures[validTier]
}

export function getUpgradeMessage(
  feature: 'quotes' | 'companies',
  userTier: SubscriptionTier,
): string {
  if (userTier === 'pro') return ''

  if (feature === 'quotes') {
    return 'Upgrade to Pro for unlimited quotes per month'
  } else {
    return 'Upgrade to Pro to add more companies'
  }
}

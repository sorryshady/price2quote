import { and, eq, gte } from 'drizzle-orm'

import db from '@/db'
import { companies, quotes } from '@/db/schema'
import type { SubscriptionFeatures, SubscriptionTier } from '@/types'

export const subscriptionFeatures: SubscriptionFeatures = {
  free: {
    maxQuotesPerMonth: 3,
    maxCompanies: 1,
    features: ['3 free quotes per month', '1 company', 'Email support'],
  },
  pro: {
    maxQuotesPerMonth: -1, // Unlimited
    maxCompanies: 5,
    features: ['Unlimited quotes', 'Up to 5 companies', 'Priority support'],
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

// Database functions for checking limits
export async function getCurrentMonthQuotes(userId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const result = await db
    .select({ count: quotes.id })
    .from(quotes)
    .where(and(eq(quotes.userId, userId), gte(quotes.createdAt, startOfMonth)))

  return result.length
}

export async function getCurrentCompanies(userId: string): Promise<number> {
  const result = await db
    .select({ count: companies.id })
    .from(companies)
    .where(eq(companies.userId, userId))

  return result.length
}

export async function canUserCreateQuote(
  userId: string,
  userTier: SubscriptionTier,
): Promise<boolean> {
  const currentQuotes = await getCurrentMonthQuotes(userId)
  return canCreateQuote(userTier, currentQuotes)
}

export async function canUserCreateCompany(
  userId: string,
  userTier: SubscriptionTier,
): Promise<boolean> {
  const currentCompanies = await getCurrentCompanies(userId)
  return canCreateCompany(userTier, currentCompanies)
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

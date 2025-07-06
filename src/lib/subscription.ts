import { and, eq, gte, isNull, or } from 'drizzle-orm'

import db from '@/db'
import { companies, quotes } from '@/db/schema'
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

// Count only original quotes (not revisions) for monthly limits
export async function getCurrentMonthOriginalQuotes(
  userId: string,
): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const result = await db
    .select({ count: quotes.id })
    .from(quotes)
    .where(
      and(
        eq(quotes.userId, userId),
        gte(quotes.createdAt, startOfMonth),
        // Only count quotes that are NOT revisions (no parentQuoteId)
        isNull(quotes.parentQuoteId),
      ),
    )

  return result.length
}

// Get the root original quote ID for a quote family
export async function getRootQuoteId(quoteId: string): Promise<string> {
  // First, get the quote to see if it has a parent
  const [quote] = await db
    .select({ parentQuoteId: quotes.parentQuoteId })
    .from(quotes)
    .where(eq(quotes.id, quoteId))

  if (!quote) {
    throw new Error('Quote not found')
  }

  // If this quote has no parent, it's the root
  if (!quote.parentQuoteId) {
    return quoteId
  }

  // Otherwise, recursively find the root
  return getRootQuoteId(quote.parentQuoteId)
}

// Count the number of edits made for a quote family
export async function getQuoteRevisionCount(quoteId: string): Promise<number> {
  try {
    // Get the root quote ID for this family
    const rootQuoteId = await getRootQuoteId(quoteId)

    // Get all quotes in this family
    const allQuotesInFamily = await db
      .select({ id: quotes.id, parentQuoteId: quotes.parentQuoteId })
      .from(quotes)
      .where(
        or(eq(quotes.id, rootQuoteId), eq(quotes.parentQuoteId, rootQuoteId)),
      )

    // Count all quotes except the root (i.e., all revisions)
    // This represents the number of edits that have been made
    const revisionCount = allQuotesInFamily.filter(
      (quote) => quote.id !== rootQuoteId,
    ).length

    return revisionCount
  } catch (error) {
    console.error('Error getting quote revision count:', error)
    return 0
  }
}

// Check if user can create a revision for a specific quote
export async function canCreateQuoteRevision(
  quoteId: string,
  userTier: SubscriptionTier,
): Promise<boolean> {
  const tier = userTier && subscriptionFeatures[userTier] ? userTier : 'free'
  const maxRevisions = subscriptionFeatures[tier].maxRevisionsPerQuote

  // Unlimited revisions for pro tier
  if (maxRevisions === -1) return true

  const currentRevisions = await getQuoteRevisionCount(quoteId)
  return currentRevisions < maxRevisions
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
  const currentQuotes = await getCurrentMonthOriginalQuotes(userId)
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

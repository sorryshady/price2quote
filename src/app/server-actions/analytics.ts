'use server'

import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'

import db from '@/db'
import {
  companies,
  emailThreads,
  quoteServices,
  quotes,
  services,
} from '@/db/schema'
import { getSession } from '@/lib/auth'
import { convertToUSD, getExchangeRateInfo } from '@/lib/currency-conversion'

interface DateRange {
  start: Date
  end: Date
}

interface AnalyticsFilters {
  dateRange: DateRange
  companyIds?: string[]
  serviceTypes?: string[]
  statuses?: string[]
}

interface RevenueAnalytics {
  totalRevenue: number
  revenueByMonth: { month: string; revenue: number; currency: string }[]
  revenueByCompany: { companyName: string; revenue: number; currency: string }[]
  revenueByService: { serviceName: string; revenue: number; currency: string }[]
  averageQuoteValue: number
  currency: string
}

interface QuotePerformanceAnalytics {
  totalQuotes: number
  acceptanceRate: number
  conversionFunnel: {
    draft: number
    awaiting_client: number
    under_revision: number
    revised: number
    accepted: number
    rejected: number
    expired: number
    paid: number
  }
  averageTimeToAcceptance: number // in days
  revisionFrequency: number
  quotesByMonth: { month: string; created: number; accepted: number }[]
}

interface ClientAnalytics {
  totalClients: number
  newClientsThisPeriod: number
  clientRetentionRate: number
  clientsByLocation: { country: string; count: number }[]
  topClients: {
    name: string
    email: string
    totalRevenue: number
    quotesCount: number
  }[]
  clientEngagement: {
    averageResponseTime: number // in hours
    conversationLength: number // average emails per conversation
  }
}

interface ServiceAnalytics {
  totalServices: number
  mostProfitableServices: {
    name: string
    revenue: number
    quotesCount: number
  }[]
  servicePerformance: {
    name: string
    acceptanceRate: number
    averageValue: number
  }[]
  serviceDemand: { name: string; requestsCount: number; month: string }[]
}

interface EmailAnalytics {
  totalEmails: number
  emailsByDirection: { inbound: number; outbound: number }
  responseRate: number
  averageResponseTime: number // in hours
  emailsByMonth: { month: string; sent: number; received: number }[]
  communicationPatterns: {
    bestTimeToSend: string
    averageConversationLength: number
    followUpEffectiveness: number
  }
}

interface BusinessGrowthAnalytics {
  growthRate: number // YoY percentage
  trendsAnalysis: {
    revenue: 'increasing' | 'decreasing' | 'stable'
    clientBase: 'increasing' | 'decreasing' | 'stable'
    quoteVolume: 'increasing' | 'decreasing' | 'stable'
  }
  marketInsights: {
    topCurrencies: { currency: string; usage: number }[]
    businessTypeDistribution: { type: string; count: number }[]
    geographicDistribution: {
      country: string
      clients: number
      revenue: number
    }[]
  }
  forecasting: {
    projectedRevenue: number
    projectedQuotes: number
    seasonalTrends: { month: string; factor: number }[]
  }
}

interface ComprehensiveAnalytics {
  summary: {
    totalRevenue: number
    totalQuotes: number
    activeClients: number
    acceptanceRate: number
    currency: string
  }
  revenue: RevenueAnalytics
  quotes: QuotePerformanceAnalytics
  clients: ClientAnalytics
  services: ServiceAnalytics
  emails: EmailAnalytics
  growth: BusinessGrowthAnalytics
  currencyInfo?: {
    isConverted: boolean
    originalCurrencies: string[]
    exchangeRates: { [currency: string]: number }
    lastUpdated: Date
  }
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function determineTrend(
  growthRate: number,
): 'increasing' | 'decreasing' | 'stable' {
  if (growthRate > 5) return 'increasing'
  if (growthRate < -5) return 'decreasing'
  return 'stable'
}

export async function getAnalyticsDataAction(
  userId: string,
  filters: AnalyticsFilters,
) {
  try {
    const session = await getSession()
    if (!session?.user?.id || session.user.id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { dateRange, companyIds, statuses } = filters

    // Base query conditions
    const baseConditions = [
      eq(quotes.userId, userId),
      gte(quotes.createdAt, dateRange.start),
      lte(quotes.createdAt, dateRange.end),
    ]

    if (companyIds?.length) {
      baseConditions.push(sql`${quotes.companyId} IN ${companyIds}`)
    }

    if (statuses?.length) {
      baseConditions.push(sql`${quotes.status} IN ${statuses}`)
    }

    // Get all quotes with company data only (no services to avoid duplication)
    // This gets ALL quote versions for further processing
    const quotesData = await db
      .select({
        quote: quotes,
        company: companies,
      })
      .from(quotes)
      .leftJoin(companies, eq(quotes.companyId, companies.id))
      .where(and(...baseConditions))
      .orderBy(desc(quotes.createdAt))

    // Process quotes to get only the latest version of each quote family
    const quotesByFamily = new Map<string, (typeof quotesData)[0]>()

    quotesData.forEach((quoteData) => {
      // Determine the family ID - either parentQuoteId if it's a revision, or the quote's own ID if it's the original
      const familyId = quoteData.quote.parentQuoteId || quoteData.quote.id
      const currentVersion = parseFloat(
        quoteData.quote.versionNumber?.toString() || '1',
      )

      const existing = quotesByFamily.get(familyId)
      if (!existing) {
        quotesByFamily.set(familyId, quoteData)
      } else {
        const existingVersion = parseFloat(
          existing.quote.versionNumber?.toString() || '1',
        )
        // Keep the highest version number (latest version)
        if (currentVersion > existingVersion) {
          quotesByFamily.set(familyId, quoteData)
        }
      }
    })

    // Convert back to array with only latest versions (final statuses)
    const finalQuotesData = Array.from(quotesByFamily.values())

    // Get email data for the same period
    const emailData = await db
      .select()
      .from(emailThreads)
      .where(
        and(
          eq(emailThreads.userId, userId),
          gte(emailThreads.sentAt, dateRange.start),
          lte(emailThreads.sentAt, dateRange.end),
        ),
      )
      .orderBy(desc(emailThreads.sentAt))

    // Get comparison period data (previous period of same length)
    const periodLength = dateRange.end.getTime() - dateRange.start.getTime()
    const prevPeriodStart = new Date(dateRange.start.getTime() - periodLength)
    const prevPeriodEnd = new Date(dateRange.end.getTime() - periodLength)

    const prevPeriodQuotes = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.userId, userId),
          gte(quotes.createdAt, prevPeriodStart),
          lte(quotes.createdAt, prevPeriodEnd),
        ),
      )

    // Calculate revenue analytics using final statuses only
    const acceptedQuotes = finalQuotesData.filter(
      (q) => q.quote.status === 'accepted' || q.quote.status === 'paid',
    )

    // Check if we have multiple currencies
    const currencies = new Set(finalQuotesData.map((q) => q.quote.currency))
    const hasMixedCurrencies = currencies.size > 1
    const primaryCurrency = finalQuotesData[0]?.quote.currency || 'USD'

    // Handle currency conversion for mixed currencies
    let totalRevenue = 0
    let currency = primaryCurrency
    let currencyInfo: ComprehensiveAnalytics['currencyInfo'] = undefined

    if (hasMixedCurrencies) {
      // Convert all currencies to USD
      const exchangeRates: { [currency: string]: number } = {}
      const originalCurrencies = Array.from(currencies)

      // Get exchange rates for all currencies
      for (const curr of currencies) {
        const rateInfo = await getExchangeRateInfo(curr)
        exchangeRates[curr] = rateInfo.rate
      }

      // Convert all amounts to USD
      for (const q of acceptedQuotes) {
        const amount = parseFloat(q.quote.amount || '0')
        const convertedAmount = await convertToUSD(amount, q.quote.currency)
        totalRevenue += convertedAmount
      }

      currency = 'USD'
      currencyInfo = {
        isConverted: true,
        originalCurrencies,
        exchangeRates,
        lastUpdated: new Date(),
      }
    } else {
      // Single currency - original logic
      totalRevenue = acceptedQuotes.reduce(
        (sum, q) => sum + parseFloat(q.quote.amount || '0'),
        0,
      )
    }

    // Revenue by month
    const revenueByMonthMap = new Map<string, number>()
    acceptedQuotes.forEach((q) => {
      const monthKey = getMonthKey(q.quote.createdAt)
      revenueByMonthMap.set(
        monthKey,
        (revenueByMonthMap.get(monthKey) || 0) +
          parseFloat(q.quote.amount || '0'),
      )
    })
    const revenueByMonth = Array.from(revenueByMonthMap.entries()).map(
      ([month, revenue]) => ({
        month,
        revenue,
        currency,
      }),
    )

    // Revenue by company
    const revenueByCompanyMap = new Map<string, number>()
    acceptedQuotes.forEach((q) => {
      const companyName = q.company?.name || 'Unknown'
      revenueByCompanyMap.set(
        companyName,
        (revenueByCompanyMap.get(companyName) || 0) +
          parseFloat(q.quote.amount || '0'),
      )
    })
    const revenueByCompany = Array.from(revenueByCompanyMap.entries()).map(
      ([companyName, revenue]) => ({
        companyName,
        revenue,
        currency,
      }),
    )

    // Revenue by service - for single company scenarios
    const acceptedQuoteIds = acceptedQuotes.map((q) => q.quote.id)

    let revenueByService: {
      serviceName: string
      revenue: number
      currency: string
    }[] = []

    if (acceptedQuoteIds.length > 0) {
      const serviceRevenueData = await db
        .select({
          quoteService: quoteServices,
          service: services,
        })
        .from(quoteServices)
        .leftJoin(services, eq(quoteServices.serviceId, services.id))
        .where(inArray(quoteServices.quoteId, acceptedQuoteIds))

      const revenueByServiceMap = new Map<string, number>()
      serviceRevenueData.forEach((item) => {
        const serviceName = item.service?.name || 'Unknown Service'
        const serviceRevenue = parseFloat(item.quoteService.totalPrice || '0')
        revenueByServiceMap.set(
          serviceName,
          (revenueByServiceMap.get(serviceName) || 0) + serviceRevenue,
        )
      })
      revenueByService = Array.from(revenueByServiceMap.entries()).map(
        ([serviceName, revenue]) => ({
          serviceName,
          revenue,
          currency,
        }),
      )
    }

    // Quote performance analytics using final statuses only
    const totalQuotes = finalQuotesData.length
    const acceptedCount = finalQuotesData.filter(
      (q) => q.quote.status === 'accepted' || q.quote.status === 'paid',
    ).length
    const acceptanceRate =
      totalQuotes > 0 ? (acceptedCount / totalQuotes) * 100 : 0

    const conversionFunnel = {
      draft: finalQuotesData.filter((q) => q.quote.status === 'draft').length,
      awaiting_client: finalQuotesData.filter(
        (q) => q.quote.status === 'awaiting_client',
      ).length,
      under_revision: finalQuotesData.filter(
        (q) => q.quote.status === 'under_revision',
      ).length,
      revised: finalQuotesData.filter((q) => q.quote.status === 'revised')
        .length,
      accepted: finalQuotesData.filter((q) => q.quote.status === 'accepted')
        .length,
      rejected: finalQuotesData.filter((q) => q.quote.status === 'rejected')
        .length,
      expired: finalQuotesData.filter((q) => q.quote.status === 'expired')
        .length,
      paid: finalQuotesData.filter((q) => q.quote.status === 'paid').length,
    }

    // Calculate average time to acceptance
    const acceptedQuotesWithSentDate = finalQuotesData.filter(
      (q) =>
        (q.quote.status === 'accepted' || q.quote.status === 'paid') &&
        q.quote.sentAt,
    )
    const totalAcceptanceTime = acceptedQuotesWithSentDate.reduce((sum, q) => {
      const sentAt = q.quote.sentAt!
      const acceptedAt = q.quote.updatedAt
      return sum + (acceptedAt.getTime() - sentAt.getTime())
    }, 0)
    const averageTimeToAcceptance =
      acceptedQuotesWithSentDate.length > 0
        ? totalAcceptanceTime /
          (acceptedQuotesWithSentDate.length * 24 * 60 * 60 * 1000) // Convert to days
        : 0

    // Quotes by month using final statuses only
    const quotesByMonthMap = new Map<
      string,
      { created: number; accepted: number }
    >()
    finalQuotesData.forEach((q) => {
      const monthKey = getMonthKey(q.quote.createdAt)
      const current = quotesByMonthMap.get(monthKey) || {
        created: 0,
        accepted: 0,
      }
      current.created++
      if (q.quote.status === 'accepted' || q.quote.status === 'paid')
        current.accepted++
      quotesByMonthMap.set(monthKey, current)
    })
    const quotesByMonth = Array.from(quotesByMonthMap.entries()).map(
      ([month, data]) => ({
        month,
        ...data,
      }),
    )

    // Client analytics using final quote statuses only
    const uniqueClients = new Set(
      finalQuotesData.map((q) => q.quote.clientEmail),
    )
    const totalClients = uniqueClients.size

    // Client by location - count unique clients per location
    const clientsByLocationMap = new Map<string, Set<string>>()
    finalQuotesData.forEach((q) => {
      const country = q.quote.clientLocation || 'Unknown'
      const email = q.quote.clientEmail
      if (email) {
        if (!clientsByLocationMap.has(country)) {
          clientsByLocationMap.set(country, new Set())
        }
        clientsByLocationMap.get(country)!.add(email)
      }
    })
    const clientsByLocation = Array.from(clientsByLocationMap.entries()).map(
      ([country, clientSet]) => ({
        country,
        count: clientSet.size,
      }),
    )

    // Top clients by revenue
    const clientRevenueMap = new Map<
      string,
      { revenue: number; quotesCount: number; name: string }
    >()
    acceptedQuotes.forEach((q) => {
      const email = q.quote.clientEmail
      if (email) {
        const current = clientRevenueMap.get(email) || {
          revenue: 0,
          quotesCount: 0,
          name: q.quote.clientName || 'Unknown',
        }
        current.revenue += parseFloat(q.quote.amount || '0')
        current.quotesCount++
        clientRevenueMap.set(email, current)
      }
    })
    const topClients = Array.from(clientRevenueMap.entries())
      .map(([email, data]) => ({
        name: data.name,
        email,
        totalRevenue: data.revenue,
        quotesCount: data.quotesCount,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)

    // Email analytics
    const totalEmails = emailData.length
    const outboundEmails = emailData.filter(
      (e) => e.direction === 'outbound',
    ).length
    const inboundEmails = emailData.filter(
      (e) => e.direction === 'inbound',
    ).length

    // Calculate response rate (inbound emails following outbound emails)
    const responseRate =
      outboundEmails > 0 ? (inboundEmails / outboundEmails) * 100 : 0

    // Emails by month
    const emailsByMonthMap = new Map<
      string,
      { sent: number; received: number }
    >()
    emailData.forEach((e) => {
      const monthKey = getMonthKey(e.sentAt)
      const current = emailsByMonthMap.get(monthKey) || { sent: 0, received: 0 }
      if (e.direction === 'outbound') current.sent++
      else current.received++
      emailsByMonthMap.set(monthKey, current)
    })
    const emailsByMonth = Array.from(emailsByMonthMap.entries()).map(
      ([month, data]) => ({
        month,
        ...data,
      }),
    )

    // Business growth analytics
    const prevPeriodRevenue = prevPeriodQuotes
      .filter((q) => q.status === 'accepted' || q.status === 'paid')
      .reduce((sum, q) => sum + parseFloat(q.amount || '0'), 0)
    const revenueGrowthRate = calculateGrowthRate(
      totalRevenue,
      prevPeriodRevenue,
    )

    const prevPeriodQuoteCount = prevPeriodQuotes.length
    const quoteVolumeGrowthRate = calculateGrowthRate(
      totalQuotes,
      prevPeriodQuoteCount,
    )

    const prevPeriodClients = new Set(
      prevPeriodQuotes.map((q) => q.clientEmail),
    ).size
    const clientBaseGrowthRate = calculateGrowthRate(
      totalClients,
      prevPeriodClients,
    )

    // Market insights using final quote statuses only
    const currencyUsageMap = new Map<string, number>()
    finalQuotesData.forEach((q) => {
      const curr = q.quote.currency || 'USD'
      currencyUsageMap.set(curr, (currencyUsageMap.get(curr) || 0) + 1)
    })
    const topCurrencies = Array.from(currencyUsageMap.entries())
      .map(([currency, usage]) => ({ currency, usage }))
      .sort((a, b) => b.usage - a.usage)

    const businessTypeMap = new Map<string, number>()
    finalQuotesData.forEach((q) => {
      const type = q.company?.businessType || 'Unknown'
      businessTypeMap.set(type, (businessTypeMap.get(type) || 0) + 1)
    })
    const businessTypeDistribution = Array.from(businessTypeMap.entries()).map(
      ([type, count]) => ({
        type,
        count,
      }),
    )

    // Construct comprehensive analytics response
    const analytics: ComprehensiveAnalytics = {
      summary: {
        totalRevenue,
        totalQuotes,
        activeClients: totalClients,
        acceptanceRate,
        currency,
      },
      revenue: {
        totalRevenue,
        revenueByMonth,
        revenueByCompany,
        revenueByService,
        averageQuoteValue: acceptedCount > 0 ? totalRevenue / acceptedCount : 0,
        currency,
      },
      quotes: {
        totalQuotes,
        acceptanceRate,
        conversionFunnel,
        averageTimeToAcceptance,
        revisionFrequency:
          (finalQuotesData.filter((q) => q.quote.parentQuoteId).length /
            totalQuotes) *
          100,
        quotesByMonth,
      },
      clients: {
        totalClients,
        newClientsThisPeriod: totalClients, // TODO: Calculate properly by checking previous periods
        clientRetentionRate: 0, // TODO: Calculate retention rate
        clientsByLocation,
        topClients,
        clientEngagement: {
          averageResponseTime: 24, // TODO: Calculate from email data
          conversationLength: emailData.length / Math.max(1, totalClients),
        },
      },
      services: {
        totalServices: 0, // TODO: Implement service analytics
        mostProfitableServices: [],
        servicePerformance: [],
        serviceDemand: [],
      },
      emails: {
        totalEmails,
        emailsByDirection: { inbound: inboundEmails, outbound: outboundEmails },
        responseRate,
        averageResponseTime: 12, // TODO: Calculate from email timestamps
        emailsByMonth,
        communicationPatterns: {
          bestTimeToSend: '9:00 AM', // TODO: Analyze email send times
          averageConversationLength:
            emailData.length /
            Math.max(1, new Set(emailData.map((e) => e.gmailThreadId)).size),
          followUpEffectiveness: 75, // TODO: Calculate follow-up effectiveness
        },
      },
      growth: {
        growthRate: revenueGrowthRate,
        trendsAnalysis: {
          revenue: determineTrend(revenueGrowthRate),
          clientBase: determineTrend(clientBaseGrowthRate),
          quoteVolume: determineTrend(quoteVolumeGrowthRate),
        },
        marketInsights: {
          topCurrencies,
          businessTypeDistribution,
          geographicDistribution: clientsByLocation.map((c) => ({
            country: c.country,
            clients: c.count,
            revenue: 0, // TODO: Calculate revenue by geography
          })),
        },
        forecasting: {
          projectedRevenue: totalRevenue * 1.2, // Simple 20% growth projection
          projectedQuotes: totalQuotes * 1.15, // 15% growth projection
          seasonalTrends: [], // TODO: Implement seasonal analysis
        },
      },
      currencyInfo,
    }

    return { success: true, data: analytics }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return { success: false, error: 'Failed to fetch analytics data' }
  }
}

export async function getQuickAnalyticsAction(userId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id || session.user.id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get last 12 months of data for quick overview
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

    const filters: AnalyticsFilters = {
      dateRange: {
        start: twelveMonthsAgo,
        end: now,
      },
    }

    return await getAnalyticsDataAction(userId, filters)
  } catch (error) {
    console.error('Error fetching quick analytics:', error)
    return { success: false, error: 'Failed to fetch quick analytics' }
  }
}

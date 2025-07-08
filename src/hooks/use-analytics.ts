'use client'

import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import {
  getAnalyticsDataAction,
  getQuickAnalyticsAction,
} from '@/app/server-actions'

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

// Get predefined date ranges
export function getDateRangePresets() {
  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const startOfThisYear = new Date(now.getFullYear(), 0, 1)
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1)
  const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

  return {
    thisMonth: { start: startOfThisMonth, end: now },
    lastMonth: { start: startOfLastMonth, end: endOfLastMonth },
    last3Months: { start: threeMonthsAgo, end: now },
    last6Months: { start: sixMonthsAgo, end: now },
    last12Months: { start: twelveMonthsAgo, end: now },
    thisYear: { start: startOfThisYear, end: now },
    lastYear: { start: startOfLastYear, end: endOfLastYear },
  }
}

// Hook for comprehensive analytics with custom filters
export function useAnalytics(
  userId: string | undefined,
  filters: AnalyticsFilters,
) {
  const queryKey = useMemo(
    () => [
      'analytics',
      userId,
      filters.dateRange.start.toISOString(),
      filters.dateRange.end.toISOString(),
      filters.companyIds?.sort().join(',') || 'all',
      filters.serviceTypes?.sort().join(',') || 'all',
      filters.statuses?.sort().join(',') || 'all',
    ],
    [filters, userId],
  )

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      const result = await getAnalyticsDataAction(userId, filters)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  })
}

// Hook for quick analytics overview (last 12 months)
export function useQuickAnalytics(userId: string | undefined) {
  return useQuery({
    queryKey: ['quick-analytics', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      const result = await getQuickAnalyticsAction(userId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  })
}

// Hook for revenue-focused analytics
export function useRevenueAnalytics(
  userId: string | undefined,
  dateRange: DateRange,
) {
  const filters: AnalyticsFilters = {
    dateRange,
    statuses: ['accepted'], // Only show accepted quotes for revenue
  }

  const { data: analytics, ...rest } = useAnalytics(userId, filters)

  const revenueData = useMemo(() => {
    if (!analytics) return null

    return {
      summary: analytics.summary,
      revenue: analytics.revenue,
      growth: analytics.growth,
      trends: analytics.revenue.revenueByMonth,
    }
  }, [analytics])

  return {
    data: revenueData,
    ...rest,
  }
}

// Hook for quote performance analytics
export function useQuotePerformanceAnalytics(
  userId: string | undefined,
  dateRange: DateRange,
) {
  const filters: AnalyticsFilters = { dateRange }

  const { data: analytics, ...rest } = useAnalytics(userId, filters)

  const quoteData = useMemo(() => {
    if (!analytics) return null

    return {
      performance: analytics.quotes,
      conversionFunnel: analytics.quotes.conversionFunnel,
      trends: analytics.quotes.quotesByMonth,
      acceptanceRate: analytics.quotes.acceptanceRate,
    }
  }, [analytics])

  return {
    data: quoteData,
    ...rest,
  }
}

// Hook for client analytics
export function useClientAnalytics(
  userId: string | undefined,
  dateRange: DateRange,
) {
  const filters: AnalyticsFilters = { dateRange }

  const { data: analytics, ...rest } = useAnalytics(userId, filters)

  const clientData = useMemo(() => {
    if (!analytics) return null

    return {
      clients: analytics.clients,
      topClients: analytics.clients.topClients,
      geographic: analytics.clients.clientsByLocation,
      engagement: analytics.clients.clientEngagement,
    }
  }, [analytics])

  return {
    data: clientData,
    ...rest,
  }
}

// Hook for email analytics
export function useEmailAnalytics(
  userId: string | undefined,
  dateRange: DateRange,
) {
  const filters: AnalyticsFilters = { dateRange }

  const { data: analytics, ...rest } = useAnalytics(userId, filters)

  const emailData = useMemo(() => {
    if (!analytics) return null

    return {
      emails: analytics.emails,
      communicationPatterns: analytics.emails.communicationPatterns,
      trends: analytics.emails.emailsByMonth,
      performance: {
        responseRate: analytics.emails.responseRate,
        averageResponseTime: analytics.emails.averageResponseTime,
      },
    }
  }, [analytics])

  return {
    data: emailData,
    ...rest,
  }
}

// Hook for business growth analytics
export function useGrowthAnalytics(
  userId: string | undefined,
  dateRange: DateRange,
) {
  const filters: AnalyticsFilters = { dateRange }

  const { data: analytics, ...rest } = useAnalytics(userId, filters)

  const growthData = useMemo(() => {
    if (!analytics) return null

    return {
      growth: analytics.growth,
      trends: analytics.growth.trendsAnalysis,
      marketInsights: analytics.growth.marketInsights,
      forecasting: analytics.growth.forecasting,
    }
  }, [analytics])

  return {
    data: growthData,
    ...rest,
  }
}

// Utility hook for analytics date range management
export function useAnalyticsDateRange(
  initialRange?: keyof ReturnType<typeof getDateRangePresets>,
) {
  const presets = getDateRangePresets()
  const defaultRange = initialRange || 'last12Months'

  return {
    presets,
    defaultRange: presets[defaultRange],
    getRange: (key: keyof typeof presets) => presets[key],
  }
}

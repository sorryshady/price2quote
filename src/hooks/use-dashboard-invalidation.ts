'use client'

import { useQueryClient } from '@tanstack/react-query'

/**
 * Hook that provides functions to invalidate dashboard-related queries
 * when quotes are created, updated, or deleted.
 *
 * This ensures that all dashboard data is refreshed immediately after
 * quote operations to show the latest information.
 */
export function useDashboardInvalidation() {
  const queryClient = useQueryClient()

  const invalidateAllDashboardData = (userId: string) => {
    // Invalidate all dashboard-related queries
    queryClient.invalidateQueries({
      queryKey: ['dashboard-summary', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['recent-activity', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['all-activity', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['action-items', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['quotes', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['latest-quotes', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['quote-limit', userId],
    })

    // Invalidate analytics queries as they depend on quote data
    queryClient.invalidateQueries({
      queryKey: ['analytics', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['quick-analytics', userId],
    })
  }

  const invalidateQuoteData = (userId: string) => {
    // Invalidate quote-specific queries
    queryClient.invalidateQueries({
      queryKey: ['quotes', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['latest-quotes', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['quote-limit', userId],
    })
  }

  const invalidateActivityData = (userId: string) => {
    // Invalidate activity-related queries
    queryClient.invalidateQueries({
      queryKey: ['recent-activity', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['all-activity', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['action-items', userId],
    })
  }

  const invalidateAnalyticsData = (userId: string) => {
    // Invalidate analytics queries
    queryClient.invalidateQueries({
      queryKey: ['analytics', userId],
    })

    queryClient.invalidateQueries({
      queryKey: ['quick-analytics', userId],
    })
  }

  return {
    invalidateAllDashboardData,
    invalidateQuoteData,
    invalidateActivityData,
    invalidateAnalyticsData,
  }
}

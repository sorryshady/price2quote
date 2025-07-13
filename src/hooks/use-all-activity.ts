'use client'

import { useQuery } from '@tanstack/react-query'

import { getAllActivityAction } from '@/app/server-actions/dashboard'

interface ActivityFilters {
  type?:
    | 'all'
    | 'quote_created'
    | 'quote_status_changed'
    | 'email_sent'
    | 'email_received'
    | 'system_event'
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year'
  limit?: number
  offset?: number
}

export function useAllActivity(
  userId: string | undefined,
  filters: ActivityFilters = {},
) {
  return useQuery({
    queryKey: ['all-activity', userId, filters],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      const result = await getAllActivityAction(userId, filters)
      if (!result.success) throw new Error(result.error)
      return result.activities
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes for activity updates
  })
}

'use client'

import { useQuery } from '@tanstack/react-query'

import { getDashboardSummaryAction } from '@/app/server-actions'

export function useDashboardSummary(userId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-summary', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      const result = await getDashboardSummaryAction(userId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for real-time feel
  })
}

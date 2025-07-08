'use client'

import { useQuery } from '@tanstack/react-query'

import { getRecentActivityAction } from '@/app/server-actions'

export function useRecentActivity(userId: string | undefined) {
  return useQuery({
    queryKey: ['recent-activity', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      const result = await getRecentActivityAction(userId)
      if (!result.success) throw new Error(result.error)
      return result.activities
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 1 * 60 * 1000, // Refetch every minute for activity feed
  })
}

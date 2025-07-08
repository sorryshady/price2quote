'use client'

import { useQuery } from '@tanstack/react-query'

import { getActionItemsAction } from '@/app/server-actions'

export function useActionItems(userId: string | undefined) {
  return useQuery({
    queryKey: ['action-items', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      const result = await getActionItemsAction(userId)
      if (!result.success) throw new Error(result.error)
      return result.items
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes for actionable items
  })
}

import { useQuery } from '@tanstack/react-query'

import { getLatestQuotesAction, getQuotesAction } from '@/app/server-actions'

export function useQuotesQuery(userId: string) {
  return useQuery({
    queryKey: ['quotes', userId],
    queryFn: () => getQuotesAction(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useLatestQuotesQuery(userId: string) {
  return useQuery({
    queryKey: ['latest-quotes', userId],
    queryFn: () => getLatestQuotesAction(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

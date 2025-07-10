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

export function useLatestQuotesQuery(userId: string, companyId?: string) {
  return useQuery({
    queryKey: ['latest-quotes', userId, companyId],
    queryFn: () => getLatestQuotesAction(userId, companyId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

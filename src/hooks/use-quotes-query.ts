import { useQuery } from '@tanstack/react-query'

import { getQuotesAction } from '@/app/server-actions'

export function useQuotesQuery(userId: string) {
  return useQuery({
    queryKey: ['quotes', userId],
    queryFn: () => getQuotesAction(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

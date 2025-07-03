import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getEmailThreadsByCompanyAction } from '@/app/server-actions/email-threads'

export function useConversationsQuery(companyId: string | null) {
  return useQuery({
    queryKey: ['conversations', companyId],
    queryFn: async () => {
      if (!companyId) {
        return { success: false, conversations: [] }
      }
      return getEmailThreadsByCompanyAction(companyId)
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useConversationsQueryClient() {
  const queryClient = useQueryClient()

  const invalidateConversations = (companyId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['conversations', companyId],
    })
  }

  const invalidateAllConversations = () => {
    queryClient.invalidateQueries({
      queryKey: ['conversations'],
    })
  }

  return {
    invalidateConversations,
    invalidateAllConversations,
  }
}

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getConversationEmailsAction } from '@/app/server-actions/email-threads'

export function useConversationQuery(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        return { success: false, emails: [] }
      }
      return getConversationEmailsAction(conversationId)
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useConversationQueryClient() {
  const queryClient = useQueryClient()

  const invalidateConversation = (conversationId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['conversation', conversationId],
    })
  }

  const invalidateAllConversations = () => {
    queryClient.invalidateQueries({
      queryKey: ['conversation'],
    })
  }

  return {
    invalidateConversation,
    invalidateAllConversations,
  }
}

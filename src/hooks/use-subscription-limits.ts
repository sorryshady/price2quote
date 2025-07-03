'use client'

import { useQuery } from '@tanstack/react-query'

import {
  checkCompanyLimitAction,
  checkQuoteLimitAction,
  checkRevisionLimitAction,
} from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'

export function useQuoteLimit() {
  const { user } = useAuth()

  const {
    data: quoteLimit,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['quote-limit', user?.id],
    queryFn: async () => {
      if (!user) return null
      return await checkQuoteLimitAction(user.id, user.subscriptionTier)
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  return {
    canCreate: quoteLimit?.success ? quoteLimit.canCreate : false,
    currentQuotes: quoteLimit?.success ? quoteLimit.currentQuotes : 0,
    upgradeMessage: quoteLimit?.success ? quoteLimit.upgradeMessage : '',
    isLoading,
    error: error?.message || null,
    refetch,
  }
}

export function useCompanyLimit() {
  const { user } = useAuth()

  const {
    data: companyLimit,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['company-limit', user?.id],
    queryFn: async () => {
      if (!user) return null
      return await checkCompanyLimitAction(user.id, user.subscriptionTier)
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    canCreate: companyLimit?.success ? companyLimit.canCreate : false,
    currentCompanies: companyLimit?.success ? companyLimit.currentCompanies : 0,
    upgradeMessage: companyLimit?.success ? companyLimit.upgradeMessage : '',
    isLoading,
    error: error?.message || null,
    refetch,
  }
}

export function useRevisionLimit(originalQuoteId: string | null) {
  const { user } = useAuth()

  const {
    data: revisionLimit,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['revision-limit', user?.id, originalQuoteId],
    queryFn: async () => {
      if (!user || !originalQuoteId) return null
      return await checkRevisionLimitAction(
        originalQuoteId,
        user.subscriptionTier,
      )
    },
    enabled: !!user && !!originalQuoteId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  return {
    canCreate: revisionLimit?.success ? revisionLimit.canCreate : false,
    currentRevisions: revisionLimit?.success
      ? revisionLimit.currentRevisions
      : 0,
    upgradeMessage: revisionLimit?.success ? revisionLimit.upgradeMessage : '',
    isLoading,
    error: error?.message || null,
    refetch,
  }
}

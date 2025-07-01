'use client'

import { useQuery } from '@tanstack/react-query'

import {
  checkCompanyLimitAction,
  checkQuoteLimitAction,
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

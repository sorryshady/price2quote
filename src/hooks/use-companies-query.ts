'use client'

import { useQuery } from '@tanstack/react-query'

import { getUserCompaniesAction } from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'

export function useCompaniesQuery() {
  const { user } = useAuth()

  const {
    data: companies = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['companies', user?.id],
    queryFn: async () => {
      if (!user) return []
      const result = await getUserCompaniesAction(user.id)
      if (result.success && result.companies) {
        return result.companies
      }
      throw new Error(result.error || 'Failed to fetch companies')
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const hasCompanies = companies.length > 0

  return {
    companies,
    isLoading,
    error: error?.message || null,
    hasCompanies,
    refetch,
  }
}

'use client'

import { useQuery } from '@tanstack/react-query'

import { getUserCompaniesAction } from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'

export function useCompaniesQuery() {
  const { user, isLoading: authLoading } = useAuth()

  const {
    data: companies = [],
    isLoading: companiesLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['companies', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const result = await getUserCompaniesAction(user.id)
      if (result.success && result.companies) {
        return result.companies
      }
      throw new Error(result.error || 'Failed to fetch companies')
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  })

  // Consider loading if either auth or companies are loading
  const isLoading = authLoading || companiesLoading

  // Only consider we have companies if we're not loading and actually have data
  const hasCompanies = !isLoading && companies.length > 0

  return {
    companies,
    isLoading,
    error: error?.message || null,
    hasCompanies,
    refetch,
  }
}

'use client'

import { useEffect, useState } from 'react'

import { getUserCompaniesAction } from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'
import type { CompanyWithServices } from '@/types'

export function useCompanies() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<CompanyWithServices[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const fetchCompanies = async () => {
    if (!user) {
      setCompanies([])
      setIsLoading(false)
      setHasInitialized(true)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await getUserCompaniesAction(user.id)

      if (result.success && result.companies) {
        setCompanies(result.companies)
      } else {
        setError(result.error || 'Failed to fetch companies')
        setCompanies([])
      }
    } catch (err) {
      setError('Error fetching companies')
      setCompanies([])
      console.error('Error in useCompanies:', err)
    } finally {
      setIsLoading(false)
      setHasInitialized(true)
    }
  }

  useEffect(() => {
    if (!hasInitialized) {
      fetchCompanies()
    }
  }, [hasInitialized])

  // Only calculate hasCompanies after we've initialized and loaded data
  const hasCompanies = hasInitialized && !isLoading && companies.length > 0

  return {
    companies,
    isLoading: isLoading && !hasInitialized,
    error,
    hasCompanies,
    refetch: fetchCompanies,
  }
}

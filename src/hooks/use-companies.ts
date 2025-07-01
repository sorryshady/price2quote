'use client'

import { useEffect, useState } from 'react'

import { getUserCompaniesAction } from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'

interface Company {
  id: string
  name: string
  description: string | null
  country: string
  businessType: 'freelancer' | 'company'
  logoUrl: string | null
  aiSummary: string | null
  aiSummaryStatus: 'pending' | 'generating' | 'completed' | 'failed' | null
  address: string | null
  phone: string | null
  website: string | null
  createdAt: Date
  updatedAt: Date
  services: Array<{
    id: string
    name: string
    description: string | null
    skillLevel: 'beginner' | 'intermediate' | 'advanced'
    basePrice: string | null
    currency: string
  }>
}

export function useCompanies() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    if (!user) {
      setCompanies([])
      setIsLoading(false)
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
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [user?.id])

  const hasCompanies = companies.length > 0

  return {
    companies,
    isLoading,
    error,
    hasCompanies,
    refetch: fetchCompanies,
  }
} 
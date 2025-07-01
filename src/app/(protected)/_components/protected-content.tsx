'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LoadingSpinner } from '@/components/ui/loading-states'
import { Skeleton } from '@/components/ui/skeleton'

import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'

interface ProtectedContentProps {
  children: React.ReactNode
}

export function ProtectedContent({ children }: ProtectedContentProps) {
  const { isLoading: authLoading } = useAuth()
  const { hasCompanies, isLoading: companiesLoading } = useCompaniesQuery()
  const router = useRouter()
  const pathname = usePathname()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Reset redirecting state when we reach the target route
    if (isRedirecting && pathname === '/add-company') {
      setIsRedirecting(false)
    }
  }, [pathname, isRedirecting])

  useEffect(() => {
    // Don't redirect if still loading
    if (authLoading || companiesLoading) return

    // If user has no companies and not on add-company page, redirect
    if (!hasCompanies && pathname !== '/add-company') {
      setIsRedirecting(true)
      router.push('/add-company')
    }
  }, [hasCompanies, pathname, authLoading, companiesLoading, router])

  // Show skeleton loading for initial auth check only
  if (authLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  // Show minimal loading for redirects
  if (isRedirecting) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingSpinner size="md" text="Redirecting..." />
      </div>
    )
  }

  // If user has no companies, only show content on add-company page
  if (!hasCompanies && pathname !== '/add-company') {
    return null
  }

  // Show children if user has companies or is on add-company page
  // Companies loading will be handled by individual components if needed
  return <>{children}</>
}

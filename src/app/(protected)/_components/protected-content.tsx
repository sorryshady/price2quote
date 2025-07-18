'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import React from 'react'

import { LoadingSpinner } from '@/components/ui/loading-states'
import { Skeleton } from '@/components/ui/skeleton'

import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'

interface ProtectedContentProps {
  children: React.ReactNode
}

function ProtectedContentComponent({ children }: ProtectedContentProps) {
  const { isLoading: authLoading, isInitialized } = useAuth()
  const { hasCompanies, isLoading: companiesLoading } = useCompaniesQuery()
  const router = useRouter()
  const pathname = usePathname()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Reset redirecting state when we reach the target route
  useEffect(() => {
    if (isRedirecting && pathname === '/add-company') {
      setIsRedirecting(false)
    }
  }, [pathname, isRedirecting])

  useEffect(() => {
    // Don't redirect if still loading or not initialized
    if (authLoading || companiesLoading || !isInitialized) return

    // Only redirect to add-company if user has no companies and is not already there
    if (!hasCompanies && pathname !== '/add-company') {
      setIsRedirecting(true)
      router.push('/add-company')
      return
    }

    // Don't redirect users away from add-company page - let them stay if they want to add more companies
  }, [
    hasCompanies,
    pathname,
    authLoading,
    companiesLoading,
    isInitialized,
    router,
  ])

  // Show skeleton loading for initial auth check only
  if (authLoading || !isInitialized) {
    return (
      <div className="space-y-6">
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

  // Show children - redirects are handled above
  // Companies loading will be handled by individual components if needed
  return <>{children}</>
}

ProtectedContentComponent.displayName = 'ProtectedContent'

export const ProtectedContent = React.memo(ProtectedContentComponent)

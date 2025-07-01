'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Loader2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { useCompanies } from '@/hooks/use-companies'

interface ProtectedContentProps {
  children: React.ReactNode
}

export function ProtectedContent({ children }: ProtectedContentProps) {
  const { isLoading: authLoading } = useAuth()
  const { hasCompanies, isLoading: companiesLoading } = useCompanies()
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

  // Show loading spinner while checking auth or companies
  if (authLoading || companiesLoading || isRedirecting) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">
            {authLoading
              ? 'Loading user...'
              : companiesLoading
                ? 'Checking companies...'
                : 'Redirecting...'}
          </p>
        </div>
      </div>
    )
  }

  // If user has no companies, only show content on add-company page
  if (!hasCompanies && pathname !== '/add-company') {
    return null
  }

  // Show children if user has companies or is on add-company page
  return <>{children}</>
}

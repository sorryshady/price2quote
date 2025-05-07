'use client'

import { useEffect } from 'react'

import { useAuth } from '@/hooks/use-auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuth()

  useEffect(() => {
    // Check auth status on mount
    checkAuth()

    // Set up an interval to check auth status periodically
    const interval = setInterval(checkAuth, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [checkAuth])

  return children
}

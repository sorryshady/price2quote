'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Loader2 } from 'lucide-react'

import { AppContainer } from '@/components/app-container'
import { Card } from '@/components/ui/card'

import { env } from '@/env/client'

import ResetPasswordForm from './_components/reset-password-form'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  const [user, setUser] = useState<{
    email: string
    id: string
    name: string
  } | null>(null)
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying',
  )
  const [message, setMessage] = useState('Verifying authorization...')
  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('You do not have a valid token to reset your password')
      setTimeout(() => router.replace('/forgot-password'), 2000)
      return
    }
    const verify = async () => {
      setStatus('verifying')
      setMessage('Verifying authorization...')
      try {
        const res = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password/verify`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          },
        )
        const data = await res.json()
        if (res.ok) {
          setUser(data.user)
          setStatus('success')
          setMessage('Token verified')
        } else {
          setStatus('error')
          setMessage(data.error || 'Invalid password reset link.')
          setTimeout(() => router.replace('/forgot-password'), 2000)
        }
      } catch {
        setStatus('error')
        setMessage(
          'An unexpected error occured. Please try again later or contact support',
        )
        setTimeout(() => router.replace('/'), 2500)
      }
    }
    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])
  if (!user) {
    setStatus('error')
    setMessage('Encountered an error. Redirecting to forgot password...')
    setTimeout(() => router.replace('/forgot-password'), 2000)
  }
  return (
    <div className="flex h-[80svh] items-center justify-center">
      <AppContainer>
        {status === 'verifying' && (
          <Card className="mx-auto flex w-full max-w-md flex-col items-center gap-6 p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <div className="text-lg font-semibold text-gray-800">
                {message}
              </div>
            </div>
          </Card>
        )}
        {status === 'success' && <ResetPasswordForm user={user} />}
        {status === 'error' && (
          <Card className="mx-auto flex w-full max-w-fit flex-col items-center gap-6 p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="text-red-600">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#fee2e2" />
                  <path
                    d="M15 9l-6 6M9 9l6 6"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-lg font-semibold text-red-700">
                {message}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Redirecting to forgot password...
              </div>
            </div>
          </Card>
        )}
      </AppContainer>
    </div>
  )
}

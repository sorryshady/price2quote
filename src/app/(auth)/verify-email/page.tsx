'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Loader2 } from 'lucide-react'

import { AppContainer } from '@/components/app-container'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying',
  )
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      setTimeout(() => router.replace('/login'), 2000)
      return
    }
    const verify = async () => {
      setStatus('verifying')
      setMessage('Verifying your email...')
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
          setTimeout(() => router.replace('/'), 2000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed.')
          setTimeout(() => router.replace('/login'), 2500)
        }
      } catch {
        setStatus('error')
        setMessage('An unexpected error occurred.')
        setTimeout(() => router.replace('/login'), 2500)
      }
    }
    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <AppContainer>
      <div className="flex min-h-[300px] flex-col items-center justify-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin" size={48} />
            <div className="text-lg font-medium text-gray-700">{message}</div>
          </div>
        )}
        {status === 'success' && (
          <>
            <div className="mb-4 text-4xl">✅</div>
            <div className="text-lg font-semibold text-green-700">
              {message}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Redirecting to home...
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mb-4 text-4xl">❌</div>
            <div className="text-lg font-semibold text-red-700">{message}</div>
            <div className="mt-2 text-sm text-gray-500">
              Redirecting to login...
            </div>
          </>
        )}
      </div>
    </AppContainer>
  )
}

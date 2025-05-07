'use client'

import { useSearchParams } from 'next/navigation'

import { AppContainer } from '@/components/app-container'
import { Card } from '@/components/ui/card'

import ResetPasswordForm from './_components/reset-password-form'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  if (!token) {
    return (
      <div className="flex h-[80svh] items-center justify-center">
        <AppContainer>
          <Card className="mx-auto flex w-full max-w-md flex-col items-center gap-6 p-8">
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
                Invalid Reset Link
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Redirecting to forgot password...
              </div>
            </div>
          </Card>
        </AppContainer>
      </div>
    )
  }

  return (
    <AppContainer>
      <ResetPasswordForm token={token} />
    </AppContainer>
  )
}

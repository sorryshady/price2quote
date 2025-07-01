'use client';

import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppContainer } from '@/components/app-container';
import { Card } from '@/components/ui/card';

import { env } from '@/env/client';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      setTimeout(() => router.replace('/login'), 2000);
      return;
    }
    const verify = async () => {
      setStatus('verifying');
      setMessage('Verifying your email...');
      try {
        const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
        setTimeout(() => router.replace('/login'), 2500);
      } catch {
        setStatus('error');
        setMessage('An unexpected error occurred.');
        setTimeout(() => router.replace('/login'), 2500);
      }
    };
    verify();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router.replace]);

  return (
    <div className="flex h-[80svh] items-center justify-center">
      <AppContainer>
        <Card className="mx-auto flex w-full max-w-md flex-col items-center gap-6 p-8">
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <div className="text-lg font-semibold text-gray-800">{message}</div>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-green-600">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                  <title>Success checkmark</title>
                  <circle cx="12" cy="12" r="12" fill="#dcfce7" />
                  <path
                    d="M8 12.5l2.5 2.5 5-5"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-lg font-semibold text-green-700">{message}</div>
              <div className="mt-2 text-sm text-gray-500">Redirecting to login...</div>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-red-600">
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                  <title>Error icon</title>
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
              <div className="text-lg font-semibold text-red-700">{message}</div>
              <div className="mt-2 text-sm text-gray-500">Redirecting to login...</div>
            </div>
          )}
        </Card>
      </AppContainer>
    </div>
  );
}

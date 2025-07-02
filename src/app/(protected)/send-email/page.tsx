'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Loader2, Mail, MailCheck, MailX } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'

import { env } from '@/env/client'
import { useCompaniesQuery } from '@/hooks/use-companies-query'

export default function SendEmailPage() {
  const { companies, isLoading, error, refetch } = useCompaniesQuery()
  const searchParams = useSearchParams()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // Get the first company (for free users) or check if any company has email
  const primaryCompany = companies?.[0]
  const hasEmailConnected = primaryCompany?.email

  // Handle URL parameters for success/error states
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'true') {
      toast.custom(
        <CustomToast message="Gmail connected successfully!" type="success" />,
      )
      refetch() // Refresh company data to show updated email
    }

    if (error) {
      toast.custom(<CustomToast message={error} type="error" />)
    }
  }, [searchParams, refetch])

  const handleConnectGmail = async () => {
    if (!primaryCompany) return

    setIsConnecting(true)
    try {
      // Redirect to Gmail OAuth
      window.location.href = `${env.NEXT_PUBLIC_API_URL}/api/auth/gmail?companyId=${primaryCompany.id}`
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      toast.custom(
        <CustomToast message="Failed to connect Gmail" type="error" />,
      )
      setIsConnecting(false)
    }
  }

  const handleDisconnectGmail = async () => {
    if (!primaryCompany) return

    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/auth/gmail/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: primaryCompany.id }),
      })

      if (response.ok) {
        toast.custom(
          <CustomToast
            message="Gmail disconnected successfully"
            type="success"
          />,
        )
        refetch() // Refresh company data
      } else {
        const data = await response.json()
        toast.custom(
          <CustomToast
            message={data.error || 'Failed to disconnect Gmail'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error)
      toast.custom(
        <CustomToast message="Failed to disconnect Gmail" type="error" />,
      )
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Send Email</h1>
          <p className="text-muted-foreground">
            Connect your Gmail account to send quotes
          </p>
        </div>
        <div className="space-y-4">
          <div className="bg-muted h-32 animate-pulse rounded-lg" />
          <div className="bg-muted h-20 animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Send Email</h1>
          <p className="text-muted-foreground">
            Connect your Gmail account to send quotes
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Error loading company data: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!primaryCompany) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Send Email</h1>
          <p className="text-muted-foreground">
            Connect your Gmail account to send quotes
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No company found. Please add a company first.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Send Email</h1>
        <p className="text-muted-foreground">
          Connect your Gmail account to send quotes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {hasEmailConnected ? (
              <>
                <MailCheck className="h-5 w-5 text-green-600" />
                Gmail Connected
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                Connect Gmail Account
              </>
            )}
          </CardTitle>
          <CardDescription>
            {hasEmailConnected
              ? `Your Gmail account (${primaryCompany.email}) is connected and ready to send quotes.`
              : 'Connect your Gmail account to send professional quotes directly to your clients.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasEmailConnected ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                <p className="text-green-800 dark:text-green-200">
                  ✓ Your Gmail account is connected and ready to send quotes
                </p>
              </div>
              <div className="flex gap-2">
                <Button disabled className="flex-1">
                  Email functionality coming soon
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnectGmail}
                  disabled={isDisconnecting}
                  className="flex items-center gap-2"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MailX className="h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/20">
                <p className="text-amber-800 dark:text-amber-200">
                  ⚠️ You need to connect your Gmail account to send quotes
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleConnectGmail}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Connect Gmail Account
                  </>
                )}
              </Button>
              <p className="text-muted-foreground text-sm">
                This will open Google&apos;s OAuth consent screen to connect
                your Gmail account for sending quotes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

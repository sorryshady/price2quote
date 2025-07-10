'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Mail, MailCheck, MailX } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { env } from '@/env/client'
import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'
import { useConversationsQueryClient } from '@/hooks/use-conversations-query'
import type { Quote } from '@/types'

import { EmailComposer, type EmailData } from './_components/email-composer'
import { QuoteSelector } from './_components/quote-selector'

export default function SendEmailPage() {
  const { user } = useAuth()
  const { companies, isLoading, error, refetch } = useCompaniesQuery()
  const queryClient = useQueryClient()
  const { invalidateConversations } = useConversationsQueryClient()
  const searchParams = useSearchParams()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Company selection state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  )

  // Get the selected company or first company (for free users)
  const selectedCompany = selectedCompanyId
    ? companies?.find((c) => c.id === selectedCompanyId)
    : companies?.[0]

  // Auto-select first company when no company is selected
  useEffect(() => {
    if (companies?.length && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id)
    }
  }, [companies, selectedCompanyId])

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
    if (!selectedCompany) return

    setIsConnecting(true)
    try {
      // Redirect to Gmail OAuth
      window.location.href = `${env.NEXT_PUBLIC_API_URL}/api/auth/gmail?companyId=${selectedCompany.id}`
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      toast.custom(
        <CustomToast message="Failed to connect Gmail" type="error" />,
      )
      setIsConnecting(false)
    }
  }

  const handleDisconnectGmail = async () => {
    if (!selectedCompany) return

    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/auth/gmail/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompany.id }),
      })

      if (response.ok) {
        toast.custom(
          <CustomToast
            message="Gmail disconnected successfully"
            type="success"
          />,
        )
        refetch() // Refresh company data to update Gmail status
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

  const handleSendEmail = async (emailData: EmailData) => {
    setIsSending(true)
    try {
      const formData = new FormData()
      formData.append('to', emailData.to)
      if (emailData.cc) formData.append('cc', emailData.cc)
      if (emailData.bcc) formData.append('bcc', emailData.bcc)
      formData.append('subject', emailData.subject)
      formData.append('body', emailData.body)
      formData.append('quoteId', emailData.quoteId)
      formData.append('includeQuotePdf', emailData.includeQuotePdf.toString())

      // Add file attachments
      emailData.attachments.forEach((file: File) => {
        formData.append('attachments', file)
      })

      const response = await fetch('/api/send-quote-email', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        toast.custom(
          <CustomToast message="Email sent successfully!" type="success" />,
        )
        // Reset form after successful send
        setSelectedQuote(null)
        // Invalidate quotes queries to update status from 'draft' or 'revised' to 'awaiting_client'
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['quotes', user?.id || ''],
          }),
          queryClient.invalidateQueries({
            queryKey: ['latest-quotes', user?.id || ''],
          }),
        ])
        // Invalidate conversations cache to show new email in conversations
        if (selectedCompany?.id) {
          await invalidateConversations(selectedCompany.id)
          // Also invalidate the specific conversation if possible
          if (result?.threadId) {
            await queryClient.invalidateQueries({
              queryKey: ['conversation', result.threadId],
            })
          }
        }
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to send email'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.custom(<CustomToast message="Failed to send email" type="error" />)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      <div className="space-y-6">
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

  if (!selectedCompany) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Send Email</h1>
          <p className="text-muted-foreground">
            Connect your Gmail account to send quotes
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No company found. Please{' '}
              <Link href="/add-company" className="text-primary underline">
                add a company
              </Link>{' '}
              first.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Use Gmail connection status from companies query
  const hasGmailConnected = selectedCompany.gmailConnected
  const gmailEmail = selectedCompany.gmailEmail

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold sm:text-3xl">Send Email</h1>
          <p className="text-muted-foreground">
            Connect your Gmail account to send quotes
          </p>
        </div>

        {/* Connected Status - Top Right */}
        {hasGmailConnected && gmailEmail && (
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <div className="flex w-full items-center gap-2 rounded-md bg-green-100 px-3 py-1.5 sm:w-auto dark:bg-green-900/30">
              <MailCheck className="h-4 w-4 text-green-600" />
              <span className="truncate text-sm font-medium text-green-700 dark:text-green-300">
                {gmailEmail}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnectGmail}
              disabled={isDisconnecting}
              className="h-8 w-full px-2 sm:w-auto"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <MailX className="mr-1 h-4 w-4" />
                  Disconnect
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Company Selector for Pro users with multiple companies */}
      {companies && companies.length > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm font-medium">Company:</span>
          <Select
            value={selectedCompanyId || ''}
            onValueChange={setSelectedCompanyId}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  <div className="flex items-center gap-2">
                    <span>{company.name}</span>
                    {company.gmailConnected && (
                      <Badge variant="secondary" className="text-xs">
                        Gmail Connected
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCompany && !selectedCompany.gmailConnected && (
            <p className="text-sm text-amber-600">
              ⚠️ This company doesn&apos;t have Gmail connected
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
      {hasGmailConnected ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <QuoteSelector
              selectedQuoteId={selectedQuote?.id || null}
              onQuoteSelect={setSelectedQuote}
              companyId={selectedCompanyId}
            />
          </div>
          <div>
            <EmailComposer
              selectedQuote={selectedQuote}
              companyName={selectedCompany?.name}
              companyDescription={selectedCompany?.description}
              companyBusinessType={selectedCompany?.businessType}
              companyCountry={selectedCompany?.country}
              companyAiSummary={selectedCompany?.aiSummary}
              companyPhone={selectedCompany?.phone}
              onSendEmail={handleSendEmail}
              isSending={isSending}
              onReset={() => setSelectedQuote(null)}
            />
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Connect Gmail Account
            </CardTitle>
            <CardDescription>
              Connect your Gmail account to send professional quotes directly to
              your clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              This will open Google&apos;s OAuth consent screen to connect your
              Gmail account for sending quotes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

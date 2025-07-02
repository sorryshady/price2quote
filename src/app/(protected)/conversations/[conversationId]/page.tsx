'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ArrowLeft, Download, Mail, Paperclip, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'
import { EmailDirectionIndicator } from '@/components/ui/email-direction-indicator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { UnreadEmailBadge } from '@/components/ui/unread-email-badge'

import { markEmailAsReadAction } from '@/app/server-actions/email-sync'
import {
  type EmailThread,
  getConversationEmailsAction,
} from '@/app/server-actions/email-threads'
import {
  getQuoteWithServicesAction,
  updateQuoteStatusAction,
} from '@/app/server-actions/quote'
import { downloadAttachment } from '@/lib/utils'
import type { QuoteStatus } from '@/types'

// Helper to split main and quoted content
function splitBody(body: string): { main: string; quoted: string } {
  // Find the first reply marker
  const replyMarker = body.match(/\nOn .+ wrote:/)
  if (replyMarker && replyMarker.index !== undefined) {
    const main = body.slice(0, replyMarker.index).trim()
    // Get the first quoted block only (up to the next reply marker or end)
    const quotedBlock = body.slice(replyMarker.index).trim()
    // Remove any nested reply markers from the quoted block
    const nestedMarker = quotedBlock.match(/\nOn .+ wrote:/)
    const quoted =
      nestedMarker && nestedMarker.index !== undefined
        ? quotedBlock.slice(0, nestedMarker.index).trim()
        : quotedBlock
    return { main, quoted }
  }
  const firstQuote = body.indexOf('\n>')
  if (firstQuote !== -1) {
    const main = body.slice(0, firstQuote).trim()
    const quotedBlock = body.slice(firstQuote).trim()
    const nestedMarker = quotedBlock.match(/\nOn .+ wrote:/)
    const quoted =
      nestedMarker && nestedMarker.index !== undefined
        ? quotedBlock.slice(0, nestedMarker.index).trim()
        : quotedBlock
    return { main, quoted }
  }
  return { main: body.trim(), quoted: '' }
}

export default function ConversationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.conversationId as string

  const [emails, setEmails] = useState<EmailThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingAttachments, setDownloadingAttachments] = useState<
    Set<string>
  >(new Set())
  const [conversationInfo, setConversationInfo] = useState<{
    projectTitle: string
    clientName: string
    clientEmail: string
    quoteStatus: string
  } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showQuoted, setShowQuoted] = useState<{ [id: string]: boolean }>({})
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus | ''>('')
  const [quoteId, setQuoteId] = useState<string | null>(null)

  useEffect(() => {
    if (conversationId) {
      loadConversationEmails()
    }
  }, [conversationId])

  useEffect(() => {
    if (emails.length > 0) {
      setQuoteId(emails[0].quoteId)
      // Fetch quote status from server
      getQuoteWithServicesAction(emails[0].quoteId).then((res) => {
        if (res.success && res.quote?.status) {
          setQuoteStatus(res.quote.status)
        }
      })
    }
  }, [emails])

  const loadConversationEmails = async () => {
    setIsLoading(true)
    try {
      const result = await getConversationEmailsAction(conversationId)
      if (result.success && result.emails) {
        setEmails(result.emails)

        // Mark unread emails as read when conversation is opened
        const unreadEmails = result.emails.filter((email) => !email.isRead)
        for (const email of unreadEmails) {
          try {
            await markEmailAsReadAction(email.gmailMessageId)
          } catch (error) {
            console.error('Error marking email as read:', error)
          }
        }

        // Extract conversation info from emails (prefer first outbound email)
        if (result.emails.length > 0) {
          const outbound = result.emails.find((e) => e.direction === 'outbound')
          const infoSource = outbound || result.emails[0]
          setConversationInfo({
            projectTitle:
              infoSource.projectTitle || infoSource.subject || 'Conversation',
            clientName: infoSource.clientName || '',
            clientEmail: infoSource.to || '',
            quoteStatus: infoSource.emailType || 'sent',
          })
        }
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to load conversation'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error loading conversation emails:', error)
      toast.custom(
        <CustomToast message="Failed to load conversation" type="error" />,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadConversationEmails()
      toast.custom(
        <CustomToast message="Conversation refreshed" type="success" />,
      )
    } catch {
      toast.custom(
        <CustomToast message="Failed to refresh conversation" type="error" />,
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    if (!quoteId) return
    setQuoteStatus(newStatus)
    const result = await updateQuoteStatusAction(quoteId, newStatus)
    if (result.success) {
      toast.custom(
        <CustomToast
          message={`Quote status updated to "${newStatus}"`}
          type="success"
        />,
      )
    } else {
      toast.custom(
        <CustomToast
          message={result.error || 'Failed to update status'}
          type="error"
        />,
      )
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-32 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          {isRefreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Conversation Info */}
      {conversationInfo && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">
                  {conversationInfo.projectTitle}
                </h1>
                <p className="text-muted-foreground">
                  {conversationInfo.clientName} ({conversationInfo.clientEmail})
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {conversationInfo.quoteStatus}
                  </Badge>
                  {emails.filter((email) => !email.isRead).length > 0 && (
                    <UnreadEmailBadge
                      isRead={false}
                      count={emails.filter((email) => !email.isRead).length}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Dropdown UI */}
      {quoteId && (
        <div className="mb-2 flex items-center gap-2">
          <span className="font-medium">Quote Status:</span>
          <Select value={quoteStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="revised">Revised</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Emails */}
      <div className="space-y-4">
        {emails.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Mail className="text-muted-foreground mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No emails found</h3>
                <p className="text-muted-foreground">
                  This conversation doesn&apos;t contain any emails.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          emails.map((email) => {
            const { main, quoted } = splitBody(email.body)
            return (
              <Card
                key={email.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="pt-6">
                  {/* Email Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{email.subject}</h3>
                        <EmailDirectionIndicator direction={email.direction} />
                        <UnreadEmailBadge isRead={email.isRead} />
                        {email.includeQuotePdf && (
                          <Badge variant="secondary" className="text-xs">
                            Quote PDF
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        To: {email.to}
                        {email.cc && ` | CC: ${email.cc}`}
                        {email.bcc && ` | BCC: ${email.bcc}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatDate(email.sentAt)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatTime(email.sentAt)}
                      </p>
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  {/* Email Body */}
                  <div className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm whitespace-pre-wrap">{main}</p>
                      {quoted && (
                        <>
                          <button
                            className="text-primary mt-1 cursor-pointer text-xs underline"
                            onClick={() =>
                              setShowQuoted((prev) => ({
                                ...prev,
                                [email.id]: !prev[email.id],
                              }))
                            }
                          >
                            {showQuoted[email.id]
                              ? 'Hide quoted'
                              : 'Show quoted'}
                          </button>
                          {showQuoted[email.id] && (
                            <pre className="text-muted-foreground border-muted mt-1 border-l-2 pl-2 text-xs whitespace-pre-wrap">
                              {quoted}
                            </pre>
                          )}
                        </>
                      )}
                    </div>

                    {/* Attachments */}
                    {email.attachments && email.attachments.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Paperclip className="text-muted-foreground h-4 w-4" />
                          <span className="text-sm font-medium">
                            Attachments (click to download):
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {email.attachments.map(
                            (attachment, attachmentIndex) => (
                              <TooltipProvider key={attachmentIndex}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-2"
                                      disabled={downloadingAttachments.has(
                                        attachment,
                                      )}
                                      onClick={async () => {
                                        setDownloadingAttachments((prev) =>
                                          new Set(prev).add(attachment),
                                        )
                                        try {
                                          await downloadAttachment(attachment)
                                          toast.custom(
                                            <CustomToast
                                              message="Attachment downloaded successfully"
                                              type="success"
                                            />,
                                          )
                                        } catch (error) {
                                          console.error(
                                            'Download error:',
                                            error,
                                          )
                                          toast.custom(
                                            <CustomToast
                                              message="Failed to download attachment"
                                              type="error"
                                            />,
                                          )
                                        } finally {
                                          setDownloadingAttachments((prev) => {
                                            const newSet = new Set(prev)
                                            newSet.delete(attachment)
                                            return newSet
                                          })
                                        }
                                      }}
                                    >
                                      {downloadingAttachments.has(
                                        attachment,
                                      ) ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                      ) : (
                                        <Download className="h-4 w-4" />
                                      )}
                                      <span className="text-sm">
                                        {attachment.split('/').pop() ||
                                          attachment}
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Click to download attachment</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email Footer */}
                  <div className="mt-4 border-t pt-4">
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span>Gmail Message ID: {email.gmailMessageId}</span>
                      {email.gmailThreadId && (
                        <span>Thread ID: {email.gmailThreadId}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

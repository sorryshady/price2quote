'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Mail, Paperclip, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'
import { EmailDirectionIndicator } from '@/components/ui/email-direction-indicator'
import { RevisionTimeline } from '@/components/ui/revision-timeline'
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

import {
  markEmailAsReadAction,
  syncConversationThreadAction,
} from '@/app/server-actions/email-sync'
import { type EmailThread } from '@/app/server-actions/email-threads'
import {
  getQuoteRevisionHistoryForConversationAction,
  getQuoteWithServicesAction,
  updateQuoteStatusAction,
} from '@/app/server-actions/quote'
import { useAuth } from '@/hooks/use-auth'
import { useConversationQuery } from '@/hooks/use-conversation-query'
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
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const conversationId = params.conversationId as string

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
  const [revisionHistory, setRevisionHistory] = useState<
    Array<{
      id: string
      versionNumber: string
      revisionNotes?: string
      sentAt: Date
      subject: string
      isRevision: boolean
      hasEmail?: boolean
    }>
  >([])

  // Use React Query for conversation caching
  const { data: conversationData, isLoading } =
    useConversationQuery(conversationId)
  const emails = conversationData?.success ? conversationData.emails || [] : []

  // React Query for revision history
  const revisionHistoryQuery = useQuery({
    queryKey: ['revision-history', quoteId],
    queryFn: async () => {
      if (!quoteId || !user?.id) {
        return { success: false, revisions: [] }
      }
      return getQuoteRevisionHistoryForConversationAction(quoteId, user.id)
    },
    enabled: !!quoteId && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Mark unread inbound emails as read when conversation is loaded
  useEffect(() => {
    if (emails.length > 0) {
      const unreadInboundEmails = emails.filter(
        (email: EmailThread) => !email.isRead && email.direction === 'inbound',
      )

      // Mark unread inbound emails as read in our database
      if (unreadInboundEmails.length > 0) {
        console.log(
          'Marking emails as read:',
          unreadInboundEmails.map((e) => ({
            id: e.gmailMessageId,
            subject: e.subject,
          })),
        )
        Promise.all(
          unreadInboundEmails.map((email) =>
            markEmailAsReadAction(email.gmailMessageId),
          ),
        )
          .then(() => {
            console.log('Successfully marked emails as read')
            // Refresh the conversation data to show updated read status
            queryClient.invalidateQueries({
              queryKey: ['conversation', conversationId],
            })
            // Also refresh the conversations list to update unread counts
            // Invalidate all conversations queries to ensure badges update
            queryClient.invalidateQueries({
              queryKey: ['conversations'],
            })
          })
          .catch((error) => {
            console.error('Error marking emails as read:', error)
          })
      }

      // Extract conversation info from emails (prefer first outbound email)
      const outbound = emails.find(
        (e: EmailThread) => e.direction === 'outbound',
      )
      const infoSource = outbound || emails[0]
      setConversationInfo({
        projectTitle:
          infoSource.projectTitle || infoSource.subject || 'Conversation',
        clientName: infoSource.clientName || '',
        clientEmail: infoSource.to || '',
        quoteStatus: infoSource.emailType || 'awaiting_client',
      })
    }
  }, [emails, conversationId, queryClient])

  useEffect(() => {
    if (emails.length > 0) {
      // Find the most recent outbound email (latest sent quote)
      const outboundEmails = emails.filter(
        (email) => email.direction === 'outbound',
      )
      const latestSentEmail =
        outboundEmails.length > 0
          ? outboundEmails[outboundEmails.length - 1]
          : emails[emails.length - 1] // Fallback to last email if no outbound

      setQuoteId(latestSentEmail.quoteId)

      // Fetch quote status from server for the latest sent quote
      getQuoteWithServicesAction(latestSentEmail.quoteId).then((res) => {
        if (res.success && res.quote?.status) {
          setQuoteStatus(res.quote.status)
        }
      })
    }
  }, [emails])

  // Update revision history when query data changes
  useEffect(() => {
    if (
      revisionHistoryQuery.data?.success &&
      revisionHistoryQuery.data.revisions
    ) {
      setRevisionHistory(
        revisionHistoryQuery.data.revisions.map((rev) => ({
          ...rev,
          revisionNotes: rev.revisionNotes || undefined,
        })),
      )
    }
  }, [revisionHistoryQuery.data])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Get company ID from the first email in the conversation
      const companyId = emails.length > 0 ? emails[0].companyId : null

      if (!companyId) {
        toast.custom(
          <CustomToast
            message="No company found for this conversation"
            type="error"
          />,
        )
        return
      }

      // Sync this specific conversation thread from Gmail
      const syncResult = await syncConversationThreadAction(
        companyId,
        conversationId,
      )

      if (syncResult.success) {
        // Invalidate conversation cache to refresh data
        await queryClient.invalidateQueries({
          queryKey: ['conversation', conversationId],
        })

        // Also invalidate conversations list to update unread counts
        await queryClient.invalidateQueries({
          queryKey: ['conversations'],
        })

        toast.custom(
          <CustomToast
            message="Conversation refreshed with latest emails"
            type="success"
          />,
        )
      } else {
        toast.custom(
          <CustomToast
            message={syncResult.error || 'Failed to sync conversation'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error refreshing conversation:', error)
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
      // Invalidate quotes queries to refresh the quotes list
      await queryClient.invalidateQueries({ queryKey: ['quotes'] })
      await queryClient.invalidateQueries({ queryKey: ['latest-quotes'] })
      await queryClient.invalidateQueries({ queryKey: ['conversations'] })
      await queryClient.invalidateQueries({ queryKey: ['revision-history'] })
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
                    {conversationInfo.quoteStatus === 'quote_sent'
                      ? 'sent'
                      : conversationInfo.quoteStatus}
                  </Badge>
                  {/* Show latest email direction */}
                  {emails.length > 0 && (
                    <EmailDirectionIndicator
                      direction={emails[emails.length - 1].direction}
                    />
                  )}
                  {/* Only count inbound unread emails */}
                  {emails.filter(
                    (email) => !email.isRead && email.direction === 'inbound',
                  ).length > 0 && (
                    <UnreadEmailBadge
                      isRead={false}
                      count={
                        emails.filter(
                          (email) =>
                            !email.isRead && email.direction === 'inbound',
                        ).length
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revision Timeline */}
      {revisionHistory.length > 1 && (
        <RevisionTimeline revisions={revisionHistory} />
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="awaiting_client">Awaiting Client</SelectItem>
              <SelectItem value="under_revision">Under Revision</SelectItem>
              <SelectItem value="revised">Revised</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          {['under_revision', 'rejected'].includes(quoteStatus) && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/quotes/${quoteId}/edit`}>Edit Quote</Link>
            </Button>
          )}
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
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <h3 className="w-full truncate text-center font-semibold sm:w-auto sm:text-left">
                          {email.subject}
                        </h3>
                        <EmailDirectionIndicator direction={email.direction} />
                        <UnreadEmailBadge
                          isRead={email.isRead}
                          direction={email.direction}
                        />
                        {email.includeQuotePdf && (
                          <Badge variant="secondary" className="text-xs">
                            Quote PDF
                          </Badge>
                        )}
                        {email.emailType === 'quote_revision_sent' && (
                          <Badge variant="outline" className="text-xs">
                            Revision
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-center text-sm sm:text-left">
                        To: {email.to}
                        {email.cc && ` | CC: ${email.cc}`}
                        {email.bcc && ` | BCC: ${email.bcc}`}
                      </p>
                    </div>
                    <div className="min-w-[90px] flex-shrink-0 text-center sm:text-right">
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
                                      className="flex max-w-xs min-w-0 items-center gap-2 truncate overflow-hidden"
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
                                      <span className="block max-w-[120px] min-w-0 truncate overflow-hidden text-sm">
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

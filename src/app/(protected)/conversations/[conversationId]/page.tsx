'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ArrowLeft, Download, Mail, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'
import { Separator } from '@/components/ui/separator'

import {
  type EmailThread,
  getConversationEmailsAction,
} from '@/app/server-actions/email-threads'

export default function ConversationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.conversationId as string

  const [emails, setEmails] = useState<EmailThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [conversationInfo, setConversationInfo] = useState<{
    projectTitle: string
    clientName: string
    clientEmail: string
    quoteStatus: string
  } | null>(null)

  useEffect(() => {
    if (conversationId) {
      loadConversationEmails()
    }
  }, [conversationId])

  const loadConversationEmails = async () => {
    setIsLoading(true)
    try {
      const result = await getConversationEmailsAction(conversationId)
      if (result.success && result.emails) {
        setEmails(result.emails)

        // Extract conversation info from first email
        if (result.emails.length > 0) {
          const firstEmail = result.emails[0]
          setConversationInfo({
            projectTitle: firstEmail.quoteId, // We'll get this from quote data later
            clientName: firstEmail.to.split('@')[0], // Simple name extraction
            clientEmail: firstEmail.to,
            quoteStatus: 'sent', // We'll get this from quote data later
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversations
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
              </div>
              <Badge variant="outline">{conversationInfo.quoteStatus}</Badge>
            </div>
          </CardContent>
        </Card>
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
          emails.map((email) => (
            <Card key={email.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                {/* Email Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{email.subject}</h3>
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
                    <p className="text-sm whitespace-pre-wrap">{email.body}</p>
                  </div>

                  {/* Attachments */}
                  {email.attachments && email.attachments.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Paperclip className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm font-medium">
                          Attachments:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {email.attachments.map(
                          (attachment, attachmentIndex) => (
                            <div
                              key={attachmentIndex}
                              className="flex items-center gap-2 rounded border px-3 py-2"
                            >
                              <Download className="text-muted-foreground h-4 w-4" />
                              <span className="text-sm">{attachment}</span>
                            </div>
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
          ))
        )}
      </div>
    </div>
  )
}

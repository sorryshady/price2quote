'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Download,
  Eye,
  Mail,
  MessageSquare,
  Search,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'
import { EmailSyncStatus } from '@/components/ui/email-sync-status'
import { Input } from '@/components/ui/input'
import { UnreadEmailBadge } from '@/components/ui/unread-email-badge'

import {
  getEmailSyncStatusAction,
  syncIncomingEmailsAction,
} from '@/app/server-actions/email-sync'
import {
  type EmailThread,
  deleteConversationAction,
} from '@/app/server-actions/email-threads'
import { useCompaniesQuery } from '@/hooks/use-companies-query'
import {
  useConversationsQuery,
  useConversationsQueryClient,
} from '@/hooks/use-conversations-query'
import type { EmailSyncStatus as EmailSyncStatusType } from '@/types'

export default function ConversationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { companies, isLoading, error } = useCompaniesQuery()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  )
  const [syncStatus, setSyncStatus] = useState<EmailSyncStatusType | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Get the first company (for free users) or use selected company
  const primaryCompany = companies?.[0]
  const currentCompanyId = selectedCompanyId || primaryCompany?.id

  // Use React Query for conversations caching
  const { data: conversationsData, isLoading: isLoadingConversations } =
    useConversationsQuery(currentCompanyId)
  const { invalidateConversations } = useConversationsQueryClient()

  const conversations = conversationsData?.success
    ? conversationsData.conversations || []
    : []

  // Load sync status when company changes
  useEffect(() => {
    if (currentCompanyId) {
      loadSyncStatus(currentCompanyId)
    }
  }, [currentCompanyId])

  const loadSyncStatus = async (companyId: string) => {
    try {
      const result = await getEmailSyncStatusAction(companyId)
      if (result.success) {
        const status = result.status
          ? {
              ...result.status,
              lastSyncAt: result.status.lastSyncAt ?? undefined,
              lastMessageId: result.status.lastMessageId ?? undefined,
              syncEnabled: result.status.syncEnabled ?? false,
              syncFrequencyMinutes: result.status.syncFrequencyMinutes ?? 15,
            }
          : null
        setSyncStatus(status)
      }
    } catch {
      setSyncStatus(null)
    }
  }

  const handleManualSync = async () => {
    if (!currentCompanyId) return
    setIsSyncing(true)
    try {
      const syncResult = await syncIncomingEmailsAction(currentCompanyId)

      // Invalidate conversations cache to refresh data
      invalidateConversations(currentCompanyId)

      // If specific conversations were updated, invalidate their individual caches
      if (
        syncResult.success &&
        syncResult.updatedConversations &&
        syncResult.updatedConversations.length > 0
      ) {
        for (const conversationId of syncResult.updatedConversations) {
          await queryClient.invalidateQueries({
            queryKey: ['conversation', conversationId],
          })
        }
      }

      await loadSyncStatus(currentCompanyId)

      // Enhanced notification with sync details
      const unreadCount = conversations.reduce(
        (sum, conv) =>
          sum +
          conv.emails.filter((email: EmailThread) => !email.isRead).length,
        0,
      )

      const updateMessage =
        syncResult.updatedConversations &&
        syncResult.updatedConversations.length > 0
          ? ` ${syncResult.updatedConversations.length} conversation(s) updated.`
          : ''

      toast.custom(
        <CustomToast
          message={`Email sync complete!${updateMessage} ${unreadCount > 0 ? `${unreadCount} unread emails found.` : 'No new emails.'}`}
          type="success"
        />,
      )
    } catch {
      toast.custom(<CustomToast message="Failed to sync emails" type="error" />)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      console.log('Deleting conversation:', conversationId)
      const result = await deleteConversationAction(conversationId)
      if (result.success) {
        // Invalidate conversations cache to refresh data
        if (currentCompanyId) {
          invalidateConversations(currentCompanyId)
        }
        toast.custom(
          <CustomToast message="Conversation deleted" type="success" />,
        )
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to delete conversation'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast.custom(
        <CustomToast message="Failed to delete conversation" type="error" />,
      )
    }
  }

  const filteredConversations = conversations.filter((conversation) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      conversation.projectTitle?.toLowerCase().includes(searchLower) ||
      conversation.clientName?.toLowerCase().includes(searchLower) ||
      conversation.clientEmail.toLowerCase().includes(searchLower) ||
      conversation.quoteStatus?.toLowerCase().includes(searchLower)
    )
  })

  const formatRelativeDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (diffInHours < 168) {
      // 7 days
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
      })
    } else {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-muted-foreground">
            View and manage your email conversations
          </p>
        </div>
        <div className="space-y-4">
          <div className="bg-muted h-10 animate-pulse rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-muted h-48 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-muted-foreground">
            View and manage your email conversations
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
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-muted-foreground">
            View and manage your email conversations
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Conversations</h1>
        <p className="text-muted-foreground">
          View and manage your email conversations with clients
        </p>
      </div>

      <EmailSyncStatus
        syncStatus={syncStatus}
        onSyncClick={handleManualSync}
        isSyncing={isSyncing}
      />

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search conversations by project, client, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Company Selector (if multiple companies) */}
        {companies && companies.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {companies.map((company) => (
              <Button
                key={company.id}
                variant={
                  selectedCompanyId === company.id ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => setSelectedCompanyId(company.id)}
                className="max-w-[200px] truncate"
              >
                <span className="truncate">{company.name}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations List */}
      {isLoadingConversations ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-muted h-48 animate-pulse rounded" />
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="text-muted-foreground mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">
                No conversations yet
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No conversations match your search criteria'
                  : 'Start sending emails to see your conversation history here.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredConversations.map((conversation) => {
            const unreadCount = conversation.emails.filter(
              (email) => !email.isRead,
            ).length

            return (
              <Card
                key={conversation.conversationId}
                className="flex flex-col transition-shadow hover:shadow-lg"
              >
                <CardHeader className="flex-shrink-0 pb-3">
                  <div className="flex w-full flex-col items-start justify-between gap-1 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <CardTitle className="truncate text-base">
                          {conversation.projectTitle || 'Untitled Project'}
                        </CardTitle>
                        {unreadCount > 0 && (
                          <UnreadEmailBadge
                            isRead={false}
                            count={unreadCount}
                          />
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-sm">
                        {conversation.clientName || conversation.clientEmail}
                      </p>
                    </div>
                    <div className="flex w-full flex-shrink-0 flex-row gap-1 sm:w-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(
                            `/conversations/${conversation.conversationId}`,
                          )
                        }
                        className="hover:text-primary h-8 w-8 p-2"
                        aria-label="View Conversation"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteConversation(conversation.conversationId)
                        }
                        className="text-destructive hover:text-destructive h-8 w-8 p-2"
                        aria-label="Delete Conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-3">
                  {/* Conversation Stats */}
                  <div className="flex flex-shrink-0 items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <Mail className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                      <span className="truncate text-sm font-medium">
                        {conversation.totalEmails} email
                        {conversation.totalEmails !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 text-xs">
                      {conversation.quoteStatus || 'draft'}
                    </Badge>
                  </div>

                  {/* Latest Email Preview */}
                  {conversation.emails.length > 0 && (
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {
                          conversation.emails[conversation.emails.length - 1]
                            .subject
                        }
                      </p>
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {
                          conversation.emails[conversation.emails.length - 1]
                            .body
                        }
                      </p>
                    </div>
                  )}

                  {/* Attachments Info */}
                  {conversation.emails.some(
                    (email) =>
                      email.attachments && email.attachments.length > 0,
                  ) && (
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Download className="text-muted-foreground h-3 w-3 flex-shrink-0" />
                      <span className="text-muted-foreground truncate text-xs">
                        Has downloadable attachments
                      </span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <Calendar className="text-muted-foreground h-3 w-3 flex-shrink-0" />
                    <p className="text-muted-foreground truncate text-xs">
                      Last: {formatRelativeDate(conversation.lastEmailAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

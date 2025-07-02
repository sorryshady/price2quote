'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
import { Input } from '@/components/ui/input'

import {
  type ConversationGroup,
  deleteConversationAction,
  getEmailThreadsByCompanyAction,
} from '@/app/server-actions/email-threads'
import { useCompaniesQuery } from '@/hooks/use-companies-query'

export default function ConversationsPage() {
  const router = useRouter()
  const { companies, isLoading, error } = useCompaniesQuery()
  const [conversations, setConversations] = useState<ConversationGroup[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  )

  // Get the first company (for free users) or use selected company
  const primaryCompany = companies?.[0]
  const currentCompanyId = selectedCompanyId || primaryCompany?.id

  useEffect(() => {
    if (currentCompanyId) {
      loadConversations(currentCompanyId)
    }
  }, [currentCompanyId])

  const loadConversations = async (companyId: string) => {
    setIsLoadingConversations(true)
    try {
      const result = await getEmailThreadsByCompanyAction(companyId)
      if (result.success && result.conversations) {
        setConversations(result.conversations)
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to load conversations'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.custom(
        <CustomToast message="Failed to load conversations" type="error" />,
      )
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const result = await deleteConversationAction(conversationId)
      if (result.success) {
        setConversations((prev) =>
          prev.filter((conv) => conv.conversationId !== conversationId),
        )
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
      <div className="space-y-6 p-6">
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
      <div className="space-y-6 p-6">
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
      <div className="space-y-6 p-6">
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
              >
                {company.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations List */}
      {isLoadingConversations ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.conversationId}
              className="transition-shadow hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">
                      {conversation.projectTitle || 'Untitled Project'}
                    </CardTitle>
                    <p className="text-muted-foreground truncate text-sm">
                      {conversation.clientName || conversation.clientEmail}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/conversations/${conversation.conversationId}`,
                        )
                      }
                      className="hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDeleteConversation(conversation.conversationId)
                      }
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Conversation Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm font-medium">
                      {conversation.totalEmails} email
                      {conversation.totalEmails !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {conversation.quoteStatus || 'draft'}
                  </Badge>
                </div>

                {/* Latest Email Preview */}
                {conversation.emails.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {
                        conversation.emails[conversation.emails.length - 1]
                          .subject
                      }
                    </p>
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {conversation.emails[conversation.emails.length - 1].body}
                    </p>
                  </div>
                )}

                {/* Attachments Info */}
                {conversation.emails.some(
                  (email) => email.attachments && email.attachments.length > 0,
                ) && (
                  <div className="flex items-center gap-1">
                    <Download className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground text-xs">
                      Has downloadable attachments
                    </span>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-1">
                  <Calendar className="text-muted-foreground h-3 w-3" />
                  <p className="text-muted-foreground text-xs">
                    Last: {formatRelativeDate(conversation.lastEmailAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

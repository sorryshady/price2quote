'use client'

import { useEffect, useState } from 'react'

import { Mail, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'
import { Input } from '@/components/ui/input'

import {
  type EmailThread,
  deleteEmailThreadAction,
  getEmailThreadsByCompanyAction,
} from '@/app/server-actions/email-threads'
import { useCompaniesQuery } from '@/hooks/use-companies-query'

interface EmailThreadWithQuote extends EmailThread {
  quote?: {
    id: string
    projectTitle: string
    clientName: string | null
    clientEmail: string | null
    status: string
  } | null
}

export default function ConversationsPage() {
  const { companies, isLoading, error } = useCompaniesQuery()
  const [threads, setThreads] = useState<EmailThreadWithQuote[]>([])
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  )

  // Get the first company (for free users) or use selected company
  const primaryCompany = companies?.[0]
  const currentCompanyId = selectedCompanyId || primaryCompany?.id

  useEffect(() => {
    if (currentCompanyId) {
      loadEmailThreads(currentCompanyId)
    }
  }, [currentCompanyId])

  const loadEmailThreads = async (companyId: string) => {
    setIsLoadingThreads(true)
    try {
      const result = await getEmailThreadsByCompanyAction(companyId)
      if (result.success && result.threads) {
        setThreads(result.threads as unknown as EmailThreadWithQuote[])
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to load conversations'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error loading email threads:', error)
      toast.custom(
        <CustomToast message="Failed to load conversations" type="error" />,
      )
    } finally {
      setIsLoadingThreads(false)
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    try {
      const result = await deleteEmailThreadAction(threadId)
      if (result.success) {
        setThreads((prev) => prev.filter((thread) => thread.id !== threadId))
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
      console.error('Error deleting thread:', error)
      toast.custom(
        <CustomToast message="Failed to delete conversation" type="error" />,
      )
    }
  }

  const filteredThreads = threads.filter((thread) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      thread.subject.toLowerCase().includes(searchLower) ||
      thread.to.toLowerCase().includes(searchLower) ||
      thread.quote?.projectTitle.toLowerCase().includes(searchLower) ||
      thread.quote?.clientName?.toLowerCase().includes(searchLower) ||
      thread.quote?.clientEmail?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Conversations</h1>
        <p className="text-muted-foreground">
          View and manage your email conversations
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search conversations by subject, client, or project..."
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
      {isLoadingThreads ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-muted h-48 animate-pulse rounded" />
          ))}
        </div>
      ) : filteredThreads.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Mail className="text-muted-foreground mx-auto h-12 w-12" />
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
          {filteredThreads.map((thread) => (
            <Card key={thread.id} className="transition-shadow hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">
                      {thread.subject}
                    </CardTitle>
                    <p className="text-muted-foreground truncate text-sm">
                      To: {thread.to}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteThread(thread.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Quote Info */}
                {thread.quote && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {thread.quote.projectTitle}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {thread.quote.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Client:{' '}
                      {thread.quote.clientName || thread.quote.clientEmail}
                    </p>
                  </div>
                )}

                {/* Email Preview */}
                <div className="space-y-1">
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {thread.body}
                  </p>
                </div>

                {/* Attachments */}
                {thread.attachments && thread.attachments.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Mail className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground text-xs">
                      {thread.attachments.length} attachment
                      {thread.attachments.length !== 1 ? 's' : ''}
                    </span>
                    {thread.includeQuotePdf && (
                      <Badge variant="secondary" className="text-xs">
                        Quote PDF
                      </Badge>
                    )}
                  </div>
                )}

                {/* Date */}
                <p className="text-muted-foreground text-xs">
                  Sent: {formatDate(thread.sentAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

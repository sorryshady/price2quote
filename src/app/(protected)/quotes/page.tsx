'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Check, Eye, File, FileDown, Mail, RefreshCcw, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { QuotesSkeleton } from '@/components/ui/loading-states'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import { useAuth } from '@/hooks/use-auth'
import { useQuotesQuery } from '@/hooks/use-quotes-query'
import { useQuoteLimit } from '@/hooks/use-subscription-limits'
import type { QuoteStatus } from '@/types'

function getStatusColor(status: QuoteStatus) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'revised':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getStatusIcon(status: QuoteStatus) {
  switch (status) {
    case 'draft':
      return <File className="h-4 w-4" />
    case 'sent':
      return <Mail className="h-4 w-4" />
    case 'accepted':
      return <Check className="h-4 w-4" />
    case 'rejected':
      return <X className="h-4 w-4" />
    case 'revised':
      return <RefreshCcw className="h-4 w-4" />
    default:
      return <File className="h-4 w-4" />
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function formatCurrency(amount: string | null, currency: string) {
  if (!amount) return 'N/A'
  const numAmount = parseFloat(amount)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(numAmount)
}

export default function QuotesPage() {
  const { user } = useAuth()
  const {
    currentQuotes,
    upgradeMessage,
    isLoading: limitLoading,
  } = useQuoteLimit()
  const {
    data: quotesData,
    isLoading: quotesLoading,
    error,
  } = useQuotesQuery(user?.id || '')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')
  const [selectedQuote, setSelectedQuote] = useState<(typeof quotes)[0] | null>(
    null,
  )
  const [showQuotePreview, setShowQuotePreview] = useState(false)

  const quotes = quotesData?.quotes || []
  const filteredQuotes =
    statusFilter === 'all'
      ? quotes
      : quotes.filter((quote) => quote.status === statusFilter)

  const handleViewQuote = (quote: (typeof quotes)[0]) => {
    // For now, we'll show a simple preview
    // In the future, this could fetch the full AI-generated quote data
    setSelectedQuote(quote)
    setShowQuotePreview(true)
  }

  const handleDownloadQuote = (quote: (typeof quotes)[0]) => {
    // TODO: Implement PDF download
    console.log('Download quote:', quote.id)
    // This would generate and download a PDF
  }

  const handleClosePreview = () => {
    setShowQuotePreview(false)
    setSelectedQuote(null)
  }

  if (limitLoading || quotesLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted h-5 w-64 animate-pulse rounded" />
        </div>
        <QuotesSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Quotes</h1>
          <p className="text-muted-foreground">Manage and track your quotes</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Error loading quotes. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Quotes</h1>
        <p className="text-muted-foreground">Manage and track your quotes</p>
      </div>

      {/* Subscription Limit for Free Users */}
      {user?.subscriptionTier === 'free' && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Quote Usage</CardTitle>
            <CardDescription>Track your monthly quote usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Usage</span>
                <span className="text-muted-foreground text-sm">
                  {currentQuotes || 0} / 3 quotes
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${Math.min(((currentQuotes || 0) / 3) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {upgradeMessage || 'Upgrade to Pro for unlimited quotes'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter by status:</span>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as QuoteStatus | 'all')
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="revised">Revised</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-muted-foreground text-sm">
          {filteredQuotes.length} quote{filteredQuotes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Quotes List */}
      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                {statusFilter === 'all'
                  ? "You haven't created any quotes yet. Create your first quote to get started."
                  : `No ${statusFilter} quotes found.`}
              </p>
              {statusFilter === 'all' && (
                <Button asChild>
                  <Link href="/new-quote">Create Your First Quote</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">
                        {quote.projectTitle}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {quote.company?.name} • {quote.company?.businessType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor(quote.status)}
                      >
                        {getStatusIcon(quote.status)} {quote.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Project Description */}
                  {quote.projectDescription && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {quote.projectDescription}
                    </p>
                  )}

                  {/* Quote Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <div className="font-medium">
                        {formatCurrency(quote.amount, quote.currency)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Client:</span>
                      <div className="font-medium">
                        {quote.clientName || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Services:</span>
                      <div className="font-medium">
                        {quote.quoteServices?.length || 0} service
                        {quote.quoteServices?.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <div className="font-medium">
                        {formatDate(quote.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Service Summary */}
                  {quote.quoteServices && quote.quoteServices.length > 0 && (
                    <div>
                      <span className="text-muted-foreground text-sm">
                        Services:
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {quote.quoteServices.slice(0, 3).map((qs) => (
                          <Badge
                            key={qs.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {qs.service?.name} ({qs.quantity})
                          </Badge>
                        ))}
                        {quote.quoteServices.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{quote.quoteServices.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-xs">
                      Last updated: {formatDate(quote.updatedAt)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewQuote(quote)}
                      >
                        <Eye className="h-4 w-4" /> View Quote
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQuote(quote)}
                      >
                        <FileDown className="h-4 w-4" /> Download PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quote Preview Modal */}
      {showQuotePreview && selectedQuote && (
        <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/50">
          <div className="bg-background max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Quote Preview</h2>
              <Button variant="outline" onClick={handleClosePreview}>
                Close
              </Button>
            </div>

            {/* Simple quote preview - in the future this would show the full AI-generated quote */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedQuote.projectTitle}</CardTitle>
                  <CardDescription>
                    {selectedQuote.company?.name} •{' '}
                    {selectedQuote.company?.businessType}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedQuote.projectDescription && (
                      <div>
                        <h4 className="mb-2 font-medium">
                          Project Description
                        </h4>
                        <p className="text-muted-foreground">
                          {selectedQuote.projectDescription}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="mb-2 font-medium">Quote Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <div className="font-medium">
                            {formatCurrency(
                              selectedQuote.amount,
                              selectedQuote.currency,
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className="font-medium">
                            {selectedQuote.status}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Client:</span>
                          <div className="font-medium">
                            {selectedQuote.clientName || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Created:
                          </span>
                          <div className="font-medium">
                            {formatDate(selectedQuote.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedQuote.quoteServices &&
                      selectedQuote.quoteServices.length > 0 && (
                        <div>
                          <h4 className="mb-2 font-medium">Services</h4>
                          <div className="space-y-2">
                            {selectedQuote.quoteServices.map((qs) => (
                              <div
                                key={qs.id}
                                className="bg-muted flex items-center justify-between rounded p-2"
                              >
                                <div>
                                  <div className="font-medium">
                                    {qs.service?.name}
                                  </div>
                                  <div className="text-muted-foreground text-sm">
                                    Quantity: {qs.quantity} • Unit Price:{' '}
                                    {formatCurrency(
                                      qs.unitPrice,
                                      selectedQuote.currency,
                                    )}
                                  </div>
                                </div>
                                <div className="font-medium">
                                  {formatCurrency(
                                    qs.totalPrice,
                                    selectedQuote.currency,
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

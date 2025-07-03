'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Eye,
  File,
  FileDown,
  FilePenLine,
  GitBranch,
  Mail,
  RefreshCcw,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import { QuotesSkeleton } from '@/components/ui/loading-states'
import { QuotePreview } from '@/components/ui/quote-preview'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

import {
  deleteQuoteAction,
  updateQuoteStatusAction,
} from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'
import { useLatestQuotesQuery } from '@/hooks/use-quotes-query'
import { useQuoteLimit } from '@/hooks/use-subscription-limits'
import type { Quote, QuoteStatus } from '@/types'

// Type for the AI-generated quote data
export type QuoteData = {
  quoteDocument: {
    executiveSummary: string
    serviceBreakdown: Array<{
      serviceName: string
      description: string
      quantity: number
      unitPrice: number
      totalPrice: number
      deliverables: string[]
    }>
    termsAndConditions: string[]
    paymentTerms: string
    deliveryTimeline: string
    nextSteps: string
  }
  presentation: {
    keyHighlights: string[]
    valueProposition: string
    competitiveAdvantages: string[]
  }
}

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
  const queryClient = useQueryClient()
  const {
    currentQuotes,
    upgradeMessage,
    isLoading: limitLoading,
  } = useQuoteLimit()
  const {
    data: quotesData,
    isLoading: quotesLoading,
    error,
  } = useLatestQuotesQuery(user?.id || '')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')
  const [selectedQuote, setSelectedQuote] = useState<(typeof quotes)[0] | null>(
    null,
  )
  const [showQuotePreview, setShowQuotePreview] = useState(false)
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null)

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

  const handleDownloadQuote = async (quote: (typeof quotes)[0]) => {
    try {
      // Show loading state
      toast.custom(<CustomToast message="Generating PDF..." type="info" />)

      // Import PDF utilities dynamically to avoid SSR issues
      const { generateQuotePDF, downloadPDF, generateQuoteFilename } =
        await import('@/lib/pdf-utils')

      // Transform quote to match expected type (convert null to undefined)

      // Generate PDF blob
      const blob = await generateQuotePDF(quote as unknown as Quote)

      // Download the PDF
      const filename = generateQuoteFilename(quote as unknown as Quote)
      downloadPDF(blob, filename)

      toast.custom(
        <CustomToast message="PDF downloaded successfully" type="success" />,
      )
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.custom(
        <CustomToast message="Failed to download PDF" type="error" />,
      )
    }
  }

  const handleStatusChange = async (
    quoteId: string,
    newStatus: QuoteStatus,
  ) => {
    const result = await updateQuoteStatusAction(quoteId, newStatus)
    if (result.success) {
      // Invalidate latest quotes query to refresh the list
      await queryClient.invalidateQueries({
        queryKey: ['latest-quotes', user?.id || ''],
      })

      // Invalidate conversations cache to refresh conversation status
      await queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })

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

  const handleDeleteQuote = async (quoteId: string) => {
    if (!user?.id) return

    setDeletingQuoteId(quoteId)

    try {
      const result = await deleteQuoteAction(quoteId, user.id)

      if (result.success) {
        toast.custom(
          <CustomToast message="Quote deleted successfully" type="success" />,
        )
        // Invalidate quote limit cache and latest quotes cache
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['quote-limit', user.id] }),
          queryClient.invalidateQueries({
            queryKey: ['latest-quotes', user.id],
          }),
        ])
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to delete quote'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error deleting quote:', error)
      toast.custom(
        <CustomToast message="Failed to delete quote" type="error" />,
      )
    } finally {
      setDeletingQuoteId(null)
    }
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
      {/* PDF Preview for the first quote */}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Quotes</h1>
        <p className="text-muted-foreground">Manage and track your quotes</p>
      </div>

      {/* Subscription Limit for Free Users */}
      {user?.subscriptionTier === 'free' && (
        <Card className="max-w-md">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg">Quote Usage</CardTitle>
            <CardDescription>Track your monthly quote usage</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-sm font-medium">Filter by status:</span>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as QuoteStatus | 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-32">
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
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">
                        {quote.projectTitle}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {quote.company?.name} • {quote.company?.businessType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="flex gap-2 sm:items-center">
                          <Badge
                            variant="outline"
                            className={getStatusColor(quote.status)}
                          >
                            {getStatusIcon(quote.status)} {quote.status}
                          </Badge>
                          {/* Version indicator */}
                          {quote.versionNumber &&
                            Number(quote.versionNumber) > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                v{quote.versionNumber}
                              </Badge>
                            )}
                        </div>
                        <Select
                          value={quote.status}
                          onValueChange={(value) =>
                            handleStatusChange(quote.id, value as QuoteStatus)
                          }
                        >
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="revised">Revised</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Project Description */}
                  {quote.projectDescription && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {quote.projectDescription}
                    </p>
                  )}

                  {/* Quote Details */}
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-muted-foreground text-xs">
                      Last updated: {formatDate(quote.updatedAt)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewQuote(quote)}
                        className="flex-1 sm:flex-none"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="ml-1 sm:ml-2">View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQuote(quote)}
                        className="flex-1 sm:flex-none"
                      >
                        <FileDown className="h-4 w-4" />
                        <span className="ml-1 sm:ml-2">Download</span>
                      </Button>
                      {/* Show Edit button for revised/rejected quotes - since we're using getLatestQuotesAction, 
                          these are already the latest versions */}
                      {['revised', 'rejected'].includes(quote.status) ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                        >
                          <Link href={`/quotes/${quote.id}/edit`}>
                            <FilePenLine className="h-4 w-4" />
                            <span className="ml-1 sm:ml-2">Edit</span>
                          </Link>
                        </Button>
                      ) : null}
                      {/* View Versions button - show if this quote has revisions or is a revision */}
                      {(quote.parentQuoteId ||
                        (quote.versionNumber &&
                          Number(quote.versionNumber) > 1)) && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                        >
                          <Link
                            href={`/quotes/${quote.parentQuoteId || quote.id}/versions`}
                          >
                            <GitBranch className="h-4 w-4" />
                            <span className="ml-1 sm:ml-2">Versions</span>
                          </Link>
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deletingQuoteId === quote.id}
                            className="flex-1 sm:flex-none"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="ml-1 sm:ml-2">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &ldquo;
                              {quote.projectTitle}&rdquo;? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Quote
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
        <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/50 p-4">
          <div className="bg-background max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg p-4 sm:p-6">
            {/* Show full AI-generated quote if available, otherwise show basic info */}
            {selectedQuote.quoteData &&
            typeof selectedQuote.quoteData === 'object' &&
            'quoteDocument' in selectedQuote.quoteData &&
            'presentation' in selectedQuote.quoteData ? (
              <QuotePreview
                quoteData={selectedQuote.quoteData as QuoteData}
                onClose={handleClosePreview}
                versionNumber={selectedQuote.versionNumber}
                isRevision={!!selectedQuote.parentQuoteId}
              />
            ) : (
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
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <span className="text-muted-foreground">
                              Amount:
                            </span>
                            <div className="font-medium">
                              {formatCurrency(
                                selectedQuote.amount,
                                selectedQuote.currency,
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Status:
                            </span>
                            <div className="font-medium">
                              {selectedQuote.status}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Client:
                            </span>
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
                                  className="bg-muted flex flex-col gap-2 rounded p-2 sm:flex-row sm:items-center sm:justify-between"
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}

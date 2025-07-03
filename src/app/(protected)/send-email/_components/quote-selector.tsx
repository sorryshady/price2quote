'use client'

import { useState } from 'react'

import { Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { QuoteVersionIndicator } from '@/components/ui/quote-version-indicator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useAuth } from '@/hooks/use-auth'
import { useLatestQuotesQuery } from '@/hooks/use-quotes-query'
import type { Quote } from '@/types'

interface QuoteSelectorProps {
  selectedQuoteId: string | null
  onQuoteSelect: (quote: Quote) => void
}

const statusFilters = [
  { value: 'all', label: 'All', color: 'default' },
  { value: 'draft', label: 'Draft', color: 'secondary' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'accepted', label: 'Accepted', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'revised', label: 'Revised', color: 'orange' },
] as const

export function QuoteSelector({
  selectedQuoteId,
  onQuoteSelect,
}: QuoteSelectorProps) {
  const { user } = useAuth()
  const { data, isLoading, error } = useLatestQuotesQuery(user?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilters)[number]['value']>('all')

  const quotes = data?.success ? data.quotes || [] : []
  const errorMessage = error?.message || data?.error || ''

  // Filter quotes based on search and status
  const filteredQuotes = (quotes as Quote[]).filter((quote) => {
    const matchesSearch =
      quote.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.clientEmail?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || quote.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: string | null, currency: string) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(parseFloat(amount))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'revised':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a Quote</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted h-10 animate-pulse rounded" />
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-muted h-32 animate-pulse rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || errorMessage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Error loading quotes: {errorMessage}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="px-3 sm:px-4">
        <CardTitle>Select a Quote (Latest Versions)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-3 sm:px-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search quotes by project, client, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as typeof statusFilter)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quote Cards */}
        {filteredQuotes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'No quotes match your search criteria'
                : 'No quotes found. Create your first quote to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredQuotes.map((quote) => (
              <Card
                key={quote.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedQuoteId === quote.id
                    ? 'ring-primary ring-2'
                    : 'hover:ring-muted-foreground/20 hover:ring-1'
                }`}
                onClick={() => onQuoteSelect(quote)}
              >
                <CardContent className="flex h-full flex-col px-6 py-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="line-clamp-2 text-lg font-semibold">
                        {quote.projectTitle}
                      </h3>
                      <div className="flex items-center gap-2">
                        <QuoteVersionIndicator
                          versionNumber={quote.versionNumber}
                          isLatest={true}
                          revisionNotes={quote.revisionNotes || undefined}
                        />
                        <Badge className={getStatusColor(quote.status)}>
                          {quote.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-muted-foreground space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Client:</span>{' '}
                        {quote.clientName || 'Not specified'}
                      </p>
                      <p className="truncate">
                        <span className="font-medium">Email:</span>{' '}
                        {quote.clientEmail || 'Not specified'}
                      </p>
                      <p>
                        <span className="font-medium">Amount:</span>{' '}
                        {formatCurrency(quote.amount ?? null, quote.currency)}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={
                      selectedQuoteId === quote.id ? 'default' : 'outline'
                    }
                    size="sm"
                    className="mt-4 w-full"
                  >
                    {selectedQuoteId === quote.id ? 'Selected' : 'Select Quote'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

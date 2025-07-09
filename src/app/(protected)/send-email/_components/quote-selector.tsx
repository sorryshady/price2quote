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
import { getStatusColorWithDarkMode } from '@/lib/quote-status-utils'
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils'
import type { Quote } from '@/types'

interface QuoteSelectorProps {
  selectedQuoteId: string | null
  onQuoteSelect: (quote: Quote) => void
}

const statusFilters = [
  { value: 'all', label: 'All', color: 'default' },
  { value: 'draft', label: 'Draft', color: 'secondary' },
  { value: 'awaiting_client', label: 'Awaiting Client', color: 'blue' },
  { value: 'under_revision', label: 'Under Revision', color: 'orange' },
  { value: 'revised', label: 'Revised', color: 'purple' },
  { value: 'accepted', label: 'Accepted', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'expired', label: 'Expired', color: 'gray' },
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
    return formatCurrencyUtil(amount, currency)
  }

  // Status color utility moved to src/lib/quote-status-utils.tsx

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
                    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row">
                      <h3 className="line-clamp-2 text-lg font-semibold">
                        {quote.projectTitle}
                      </h3>
                      <div className="flex items-center gap-2">
                        <QuoteVersionIndicator
                          versionNumber={quote.versionNumber}
                          isLatest={true}
                          revisionNotes={quote.revisionNotes || undefined}
                        />
                        <Badge
                          className={getStatusColorWithDarkMode(quote.status)}
                        >
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

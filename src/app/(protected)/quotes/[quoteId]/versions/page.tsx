'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ArrowLeft, File, GitBranch, Mail, RefreshCw, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { getQuoteVersionHistoryAction } from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'
import type { Quote, QuoteStatus } from '@/types'

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
      return <X className="h-4 w-4" />
    case 'rejected':
      return <X className="h-4 w-4" />
    case 'revised':
      return <RefreshCw className="h-4 w-4" />
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

export default function QuoteVersionsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const quoteId = params?.quoteId as string

  const [loading, setLoading] = useState(true)
  const [versions, setVersions] = useState<Quote[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVersions() {
      if (!user?.id || !quoteId) return
      setLoading(true)
      const result = await getQuoteVersionHistoryAction(quoteId, user.id)
      if (result.success && result.versions) {
        setVersions(result.versions as Quote[])
      } else {
        setError(result.error || 'Failed to load quote versions.')
      }
      setLoading(false)
    }
    fetchVersions()
  }, [user?.id, quoteId])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="space-y-6">
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

  if (error) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="text-center">
          <div className="mb-4 text-red-600">{error}</div>
          <Button asChild>
            <Link href="/quotes">Back to Quotes</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="text-center">
          <div className="mb-4">No versions found for this quote.</div>
          <Button asChild>
            <Link href="/quotes">Back to Quotes</Link>
          </Button>
        </div>
      </div>
    )
  }

  const originalQuote = versions.find((v) => !v.parentQuoteId) || versions[0]
  const revisions = versions.filter((v) => v.parentQuoteId)

  return (
    <div className="mx-auto max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Quote Versions</h1>
              <p className="text-muted-foreground">
                {originalQuote.projectTitle}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/quotes">View All Quotes</Link>
          </Button>
        </div>
      </div>

      {/* Original Quote */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Original Quote</span>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getStatusColor(originalQuote.status)}
              >
                {getStatusIcon(originalQuote.status)} {originalQuote.status}
              </Badge>
              <Badge variant="secondary">v{originalQuote.versionNumber}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className="text-muted-foreground text-sm font-medium">
                Amount:
              </span>
              <div className="font-medium">
                {formatCurrency(
                  originalQuote.amount || null,
                  originalQuote.currency,
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm font-medium">
                Client:
              </span>
              <div className="font-medium">
                {originalQuote.clientName ||
                  originalQuote.clientEmail ||
                  'Not specified'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm font-medium">
                Created:
              </span>
              <div className="font-medium">
                {formatDate(originalQuote.createdAt)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm font-medium">
                Services:
              </span>
              <div className="font-medium">
                {originalQuote.quoteServices?.length || 0} services
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/quotes/${originalQuote.id}`}>View Details</Link>
            </Button>
            {['revised', 'rejected'].includes(originalQuote.status) && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/quotes/${originalQuote.id}/edit`}>Edit</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revisions */}
      {revisions.length > 0 && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Revisions ({revisions.length})
            </h2>
            <p className="text-muted-foreground text-sm">
              Updated versions of the original quote
            </p>
          </div>
          <div className="space-y-4">
            {revisions.map((revision) => (
              <Card key={revision.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Revision {revision.versionNumber}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor(revision.status)}
                      >
                        {getStatusIcon(revision.status)} {revision.status}
                      </Badge>
                      <Badge variant="secondary">
                        v{revision.versionNumber}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Created {formatDate(revision.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground text-sm font-medium">
                        Amount:
                      </span>
                      <div className="font-medium">
                        {formatCurrency(
                          revision.amount || null,
                          revision.currency,
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm font-medium">
                        Client:
                      </span>
                      <div className="font-medium">
                        {revision.clientName ||
                          revision.clientEmail ||
                          'Not specified'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm font-medium">
                        Services:
                      </span>
                      <div className="font-medium">
                        {revision.quoteServices?.length || 0} services
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm font-medium">
                        Updated:
                      </span>
                      <div className="font-medium">
                        {formatDate(revision.updatedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Revision Notes */}
                  {revision.revisionNotes && (
                    <div className="mt-4">
                      <span className="text-muted-foreground text-sm font-medium">
                        Revision Notes:
                      </span>
                      <p className="mt-1 text-sm">{revision.revisionNotes}</p>
                    </div>
                  )}

                  {/* Client Feedback */}
                  {revision.clientFeedback && (
                    <div className="mt-4">
                      <span className="text-muted-foreground text-sm font-medium">
                        Client Feedback:
                      </span>
                      <p className="mt-1 text-sm">{revision.clientFeedback}</p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/quotes/${revision.id}`}>View Details</Link>
                    </Button>
                    {['revised', 'rejected'].includes(revision.status) && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/quotes/${revision.id}/edit`}>Edit</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* No Revisions Message */}
      {revisions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-2">
              <GitBranch className="text-muted-foreground mx-auto h-12 w-12" />
              <p className="text-muted-foreground">
                No revisions have been created for this quote yet.
              </p>
              <p className="text-muted-foreground text-sm">
                Revisions will appear here when you edit and save changes to the
                quote.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

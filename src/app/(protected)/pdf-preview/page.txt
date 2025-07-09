'use client'

import { Suspense, useState } from 'react'

import { PDFViewer } from '@react-pdf/renderer'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuotePDF } from '@/components/ui/quote-pdf'
import { Skeleton } from '@/components/ui/skeleton'

import { useAuth } from '@/hooks/use-auth'
import { useLatestQuotesQuery } from '@/hooks/use-quotes-query'
import type { Quote } from '@/types'

function PDFPreviewContent() {
  const { user } = useAuth()
  const { data: quotesData, isLoading } = useLatestQuotesQuery(user?.id || '')
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState(0)

  const quotes = quotesData?.quotes || []
  const selectedQuote = quotes[selectedQuoteIndex]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-[800px] w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!quotes.length) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">PDF Preview</h1>
          <p className="text-muted-foreground">
            Live preview of your quote PDFs
          </p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No quotes available for preview
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Create your first quote to see the PDF preview
            </p>
            <Button className="mt-4" asChild>
              <a href="/new-quote">Create Quote</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">PDF Preview</h1>
        <p className="text-muted-foreground">
          Live preview of your quote PDFs - changes update instantly
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Quote Selection Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Quote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quotes.map((quote, index) => (
                <Button
                  key={quote.id}
                  variant={index === selectedQuoteIndex ? 'default' : 'outline'}
                  className="h-auto w-full justify-start p-3 text-left"
                  onClick={() => setSelectedQuoteIndex(index)}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {quote.projectTitle || 'Untitled Quote'}
                    </p>
                    <p className="text-xs opacity-70">
                      {quote.clientName || 'No client name'}
                    </p>
                    <p className="text-xs opacity-70">Status: {quote.status}</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Quote Details */}
          {selectedQuote && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Quote Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Project</p>
                  <p className="text-muted-foreground text-sm">
                    {selectedQuote.projectTitle || 'Untitled'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Client</p>
                  <p className="text-muted-foreground text-sm">
                    {selectedQuote.clientName || 'No client'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-muted-foreground text-sm">
                    {selectedQuote.amount
                      ? `${selectedQuote.currency || 'USD'} ${selectedQuote.amount}`
                      : 'No amount set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-muted-foreground text-sm capitalize">
                    {selectedQuote.status.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(selectedQuote.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* PDF Viewer */}
        <div className="lg:col-span-3">
          {selectedQuote ? (
            <Card className="h-[800px] overflow-hidden">
              <CardContent className="h-full p-0">
                <PDFViewer
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  showToolbar={true}
                >
                  <QuotePDF
                    quote={
                      {
                        ...selectedQuote,
                        deliveryTimeline:
                          (selectedQuote as any).deliveryTimeline ||
                          'to_be_determined',
                        projectComplexity:
                          (selectedQuote as any).projectComplexity ||
                          'standard',
                        quoteData: (selectedQuote as any).quoteData as
                          | JSON
                          | undefined,
                      } as Quote
                    }
                  />
                </PDFViewer>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[800px]">
              <CardContent className="flex h-full items-center justify-center p-12 text-center">
                <div>
                  <p className="text-muted-foreground text-lg">
                    Select a quote to preview
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Choose a quote from the sidebar to see its PDF preview
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PDFPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-[800px] w-full" />
        </div>
      }
    >
      <PDFPreviewContent />
    </Suspense>
  )
}

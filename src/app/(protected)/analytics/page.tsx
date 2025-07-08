'use client'

import { useState } from 'react'

import { Download, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useAnalyticsDateRange, useQuickAnalytics } from '@/hooks/use-analytics'
import { useAuth } from '@/hooks/use-auth'

import { AnalyticsSummary } from './_components/analytics-summary'
import { DateRangeSelector } from './_components/date-range-selector'
import { QuotePerformanceCharts } from './_components/quote-performance-charts'
import { RevenueCharts } from './_components/revenue-charts'

interface DateRange {
  start: Date
  end: Date
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user, isLoading: authLoading, isInitialized } = useAuth()
  const { defaultRange } = useAnalyticsDateRange('last12Months')
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)

  // For MVP, using quick analytics with last 12 months
  const { data: analytics, isLoading: analyticsLoading } = useQuickAnalytics(
    user?.id,
  )

  // Wait for auth to be initialized
  if (!isInitialized || authLoading) {
    return <AnalyticsSkeleton />
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            Please log in to view analytics.
          </p>
        </div>
      </div>
    )
  }

  if (analyticsLoading) {
    return <AnalyticsSkeleton />
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <div className="flex items-center gap-2">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            No analytics data available. Create some quotes to see insights!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and performance insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <AnalyticsSummary data={analytics.summary} growth={analytics.growth} />

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.revenue.revenueByMonth.length > 0 ? (
                  <RevenueCharts
                    revenueByMonth={analytics.revenue.revenueByMonth.slice(-6)} // Last 6 months
                    revenueByCompany={analytics.revenue.revenueByCompany.slice(
                      0,
                      5,
                    )} // Top 5 companies
                    currency={analytics.summary.currency}
                  />
                ) : (
                  <div className="text-muted-foreground flex h-[200px] items-center justify-center">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quote Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.quotes.totalQuotes > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.quotes.acceptanceRate.toFixed(1)}%
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Acceptance Rate
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.quotes.averageTimeToAcceptance.toFixed(1)}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Days to Accept
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {analytics.quotes.totalQuotes} Total Quotes
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {analytics.quotes.conversionFunnel.accepted} accepted,{' '}
                        {analytics.quotes.conversionFunnel.rejected} rejected
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex h-[200px] items-center justify-center">
                    No quote data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Client & Email Overview */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {analytics.clients.totalClients}
                    </div>
                    <p className="text-muted-foreground">Active Clients</p>
                  </div>
                  {analytics.clients.topClients.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Top Client</h4>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="font-medium">
                          {analytics.clients.topClients[0].name}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {analytics.clients.topClients[0].quotesCount} quotes
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {analytics.emails.totalEmails}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Total Emails
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.emails.responseRate.toFixed(1)}%
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Response Rate
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center text-sm">
                    <div>
                      <div className="font-medium">
                        {analytics.emails.emailsByDirection.outbound}
                      </div>
                      <p className="text-muted-foreground">Sent</p>
                    </div>
                    <div>
                      <div className="font-medium">
                        {analytics.emails.emailsByDirection.inbound}
                      </div>
                      <p className="text-muted-foreground">Received</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <RevenueCharts
            revenueByMonth={analytics.revenue.revenueByMonth}
            revenueByCompany={analytics.revenue.revenueByCompany}
            currency={analytics.summary.currency}
          />
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-6">
          <QuotePerformanceCharts
            conversionFunnel={analytics.quotes.conversionFunnel}
            quotesByMonth={analytics.quotes.quotesByMonth}
            acceptanceRate={analytics.quotes.acceptanceRate}
            averageTimeToAcceptance={analytics.quotes.averageTimeToAcceptance}
            revisionFrequency={analytics.quotes.revisionFrequency}
          />
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Clients by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.clients.topClients
                    .slice(0, 8)
                    .map(
                      (client: {
                        name: string
                        email: string
                        totalRevenue: number
                        quotesCount: number
                      }) => (
                        <div
                          key={client.email}
                          className="flex items-center justify-between border-b pb-2 last:border-0"
                        >
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-muted-foreground text-sm">
                              {client.email}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {client.totalRevenue.toLocaleString()}{' '}
                              {analytics.summary.currency}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {client.quotesCount} quotes
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.clients.clientsByLocation
                    .slice(0, 8)
                    .map((location: { country: string; count: number }) => (
                      <div
                        key={location.country}
                        className="flex items-center justify-between"
                      >
                        <span className="font-medium">{location.country}</span>
                        <span className="text-muted-foreground">
                          {location.count} clients
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Business Growth Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-bold ${
                        analytics.growth.growthRate >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {analytics.growth.growthRate >= 0 ? '+' : ''}
                      {analytics.growth.growthRate.toFixed(1)}%
                    </div>
                    <p className="text-muted-foreground">Overall Growth Rate</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Revenue:</span>
                      <span
                        className={`font-medium ${
                          analytics.growth.trendsAnalysis.revenue ===
                          'increasing'
                            ? 'text-green-600'
                            : analytics.growth.trendsAnalysis.revenue ===
                                'decreasing'
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {analytics.growth.trendsAnalysis.revenue}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client Base:</span>
                      <span
                        className={`font-medium ${
                          analytics.growth.trendsAnalysis.clientBase ===
                          'increasing'
                            ? 'text-green-600'
                            : analytics.growth.trendsAnalysis.clientBase ===
                                'decreasing'
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {analytics.growth.trendsAnalysis.clientBase}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quote Volume:</span>
                      <span
                        className={`font-medium ${
                          analytics.growth.trendsAnalysis.quoteVolume ===
                          'increasing'
                            ? 'text-green-600'
                            : analytics.growth.trendsAnalysis.quoteVolume ===
                                'decreasing'
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {analytics.growth.trendsAnalysis.quoteVolume}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Top Currencies</h4>
                    <div className="space-y-1">
                      {analytics.growth.marketInsights.topCurrencies
                        .slice(0, 5)
                        .map((curr: { currency: string; usage: number }) => (
                          <div
                            key={curr.currency}
                            className="flex justify-between text-sm"
                          >
                            <span>{curr.currency}</span>
                            <span className="text-muted-foreground">
                              {curr.usage} quotes
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-medium">Business Types</h4>
                    <div className="space-y-1">
                      {analytics.growth.marketInsights.businessTypeDistribution
                        .slice(0, 5)
                        .map((type: { type: string; count: number }) => (
                          <div
                            key={type.type}
                            className="flex justify-between text-sm"
                          >
                            <span>{type.type}</span>
                            <span className="text-muted-foreground">
                              {type.count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

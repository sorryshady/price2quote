'use client'

import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { formatCurrency } from '@/lib/utils'

interface AnalyticsSummaryProps {
  data: {
    totalRevenue: number
    totalQuotes: number
    activeClients: number
    acceptanceRate: number
    currency: string
  }
  growth?: {
    growthRate: number
    trendsAnalysis: {
      revenue: 'increasing' | 'decreasing' | 'stable'
      clientBase: 'increasing' | 'decreasing' | 'stable'
      quoteVolume: 'increasing' | 'decreasing' | 'stable'
    }
  }
}

function getTrendIcon(trend: 'increasing' | 'decreasing' | 'stable') {
  switch (trend) {
    case 'increasing':
      return <ArrowUp className="h-4 w-4 text-green-500" />
    case 'decreasing':
      return <ArrowDown className="h-4 w-4 text-red-500" />
    case 'stable':
      return <TrendingUp className="h-4 w-4 text-gray-500" />
  }
}

function getTrendColor(trend: 'increasing' | 'decreasing' | 'stable') {
  switch (trend) {
    case 'increasing':
      return 'text-green-600'
    case 'decreasing':
      return 'text-red-600'
    case 'stable':
      return 'text-gray-600'
  }
}

export function AnalyticsSummary({ data, growth }: AnalyticsSummaryProps) {
  const { totalRevenue, totalQuotes, activeClients, acceptanceRate, currency } =
    data

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalRevenue, currency)}
          </div>
          {growth && (
            <div className="flex items-center gap-1 pt-1">
              {getTrendIcon(growth.trendsAnalysis.revenue)}
              <span
                className={`text-xs ${getTrendColor(growth.trendsAnalysis.revenue)}`}
              >
                {growth.trendsAnalysis.revenue}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Quotes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
          <FileText className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuotes}</div>
          {growth && (
            <div className="flex items-center gap-1 pt-1">
              {getTrendIcon(growth.trendsAnalysis.quoteVolume)}
              <span
                className={`text-xs ${getTrendColor(growth.trendsAnalysis.quoteVolume)}`}
              >
                {growth.trendsAnalysis.quoteVolume}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Clients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeClients}</div>
          {growth && (
            <div className="flex items-center gap-1 pt-1">
              {getTrendIcon(growth.trendsAnalysis.clientBase)}
              <span
                className={`text-xs ${getTrendColor(growth.trendsAnalysis.clientBase)}`}
              >
                {growth.trendsAnalysis.clientBase}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acceptance Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
          <BarChart3 className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{acceptanceRate.toFixed(1)}%</div>
          <p className="text-muted-foreground text-xs">
            Quote to acceptance conversion
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

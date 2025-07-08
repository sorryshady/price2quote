'use client'

import {
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  MessageSquare,
  RefreshCw,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

import { formatCurrency } from '@/lib/utils'

interface TodaysSummaryProps {
  data: {
    currentMonth: {
      quotesCreated: number
      revisionsCreated: number
      quotesAccepted: number
      quotesRevised: number
      pendingQuotes: number
      revenue: number
      currency: string
    }
    conversations: {
      total: number
      unread: number
      needingFollowUp: number
    }
  }
  subscriptionTier: 'free' | 'pro'
  quotesUsed: number
}

export function TodaysSummary({
  data,
  subscriptionTier,
  quotesUsed,
}: TodaysSummaryProps) {
  const { currentMonth, conversations } = data
  const maxQuotes = subscriptionTier === 'free' ? 3 : 999
  const quotesProgress =
    subscriptionTier === 'free' ? (quotesUsed / maxQuotes) * 100 : 0

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">This Month</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Quotes Created */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quotes Created
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonth.quotesCreated}
            </div>
            {currentMonth.revisionsCreated > 0 && (
              <p className="text-muted-foreground text-xs">
                + {currentMonth.revisionsCreated} revisions
              </p>
            )}
            {subscriptionTier === 'free' && (
              <div className="mt-2 space-y-1">
                <Progress value={quotesProgress} className="h-2" />
                <p className="text-muted-foreground text-xs">
                  {quotesUsed} of {maxQuotes} used
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Acceptance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quotes Accepted
            </CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonth.quotesAccepted}
            </div>
            {currentMonth.quotesCreated > 0 && (
              <p className="text-muted-foreground text-xs">
                {Math.round(
                  (currentMonth.quotesAccepted / currentMonth.quotesCreated) *
                    100,
                )}
                % acceptance rate
              </p>
            )}
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonth.revenue, currentMonth.currency)}
            </div>
            <p className="text-muted-foreground text-xs">
              From {currentMonth.quotesAccepted} accepted quotes
            </p>
          </CardContent>
        </Card>

        {/* Active Work */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Work</CardTitle>
            <RefreshCw className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonth.pendingQuotes + currentMonth.quotesRevised}
            </div>
            <p className="text-muted-foreground text-xs">
              {currentMonth.pendingQuotes} pending, {currentMonth.quotesRevised}{' '}
              revising
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Communication Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Conversations
            </CardTitle>
            <MessageSquare className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unread Messages
            </CardTitle>
            <Mail className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {conversations.unread}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Need Follow-up
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {conversations.needingFollowUp}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

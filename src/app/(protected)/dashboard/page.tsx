'use client'

import Link from 'next/link'

import { MailCheck, Settings } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DashboardSkeleton } from '@/components/ui/loading-states'

import { useActionItems } from '@/hooks/use-action-items'
import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'
import { useRecentActivity } from '@/hooks/use-recent-activity'
import { useQuoteLimit } from '@/hooks/use-subscription-limits'

import { ActionRequired } from './_components/action-required'
import { RecentActivity } from './_components/recent-activity'
import { TodaysSummary } from './_components/todays-summary'

export default function DashboardPage() {
  const { user, isLoading: authLoading, isInitialized } = useAuth()
  const { companies, isLoading: companiesLoading } = useCompaniesQuery()
  const { currentQuotes, isLoading: quoteLimitLoading } = useQuoteLimit()

  // Dashboard data hooks
  const { data: summaryData, isLoading: summaryLoading } = useDashboardSummary(
    user?.id,
  )

  const { data: actionItems = [], isLoading: actionsLoading } = useActionItems(
    user?.id,
  )

  const { data: recentActivities = [], isLoading: activitiesLoading } =
    useRecentActivity(user?.id)

  // Wait for auth to be initialized and core data to load
  if (
    !isInitialized ||
    authLoading ||
    companiesLoading ||
    quoteLimitLoading ||
    summaryLoading
  ) {
    return <DashboardSkeleton />
  }

  if (!summaryData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load dashboard data. Please try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-muted-foreground text-sm">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}
        </div>
      </div>

      {/* Today's Summary Section */}
      <TodaysSummary
        data={summaryData}
        subscriptionTier={user?.subscriptionTier || 'free'}
        quotesUsed={currentQuotes || 0}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Action Required */}
          {actionsLoading ? (
            <div className="bg-muted h-64 animate-pulse rounded-lg" />
          ) : (
            <ActionRequired items={actionItems} />
          )}

          {/* Recent Activity */}
          {activitiesLoading ? (
            <div className="bg-muted h-96 animate-pulse rounded-lg" />
          ) : (
            <RecentActivity activities={recentActivities} />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Companies Overview with Gmail Status */}
          {companies && companies.length > 0 && (
            <div className="bg-card rounded-lg border p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Companies</h3>
                <Button asChild variant="outline" size="sm">
                  <Link href="/companies">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage All
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {companies.slice(0, 3).map((company) => (
                  <Link
                    key={company.id}
                    href={`/companies/${company.id}`}
                    className="bg-background/50 hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {company.logoUrl && (
                        <img
                          src={company.logoUrl}
                          alt={company.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">
                            {company.name}
                          </h4>
                          {company.gmailConnected && company.gmailEmail && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <MailCheck className="h-3 w-3" />
                              {company.gmailEmail}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {company.businessType} • {company.country}
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {company.currency}
                    </div>
                  </Link>
                ))}
                {companies.length > 3 && (
                  <div className="pt-2 text-center">
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/companies">
                        View all {companies.length} companies
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-4 text-lg font-semibold">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">AI Services</span>
                </div>
                <span className="text-muted-foreground text-xs">Active</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      user?.subscriptionTier === 'pro'
                        ? 'bg-blue-500'
                        : 'bg-gray-500'
                    }`}
                  />
                  <span className="text-sm">Subscription</span>
                </div>
                <span className="text-muted-foreground text-xs capitalize">
                  {user?.subscriptionTier || 'free'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

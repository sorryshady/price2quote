'use client'

import { useState } from 'react'

import { Calendar, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardSkeleton } from '@/components/ui/loading-states'

import { useAllActivity } from '@/hooks/use-all-activity'
import { useAuth } from '@/hooks/use-auth'

import { ActivityFilters } from './_components/activity-filters'
import { ActivityList } from './_components/activity-list'

type FilterType =
  | 'all'
  | 'quote_created'
  | 'quote_status_changed'
  | 'email_sent'
  | 'email_received'
  | 'system_event'
type DateRangeType = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year'

export default function ActivityPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [filters, setFilters] = useState<{
    type: FilterType
    dateRange: DateRangeType
    limit: number
    offset: number
  }>({
    type: 'all',
    dateRange: 'all',
    limit: 50,
    offset: 0,
  })

  const {
    data: activities,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useAllActivity(user?.id, filters)

  if (authLoading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Activity History</h1>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            Please log in to view your activity.
          </p>
        </div>
      </div>
    )
  }

  const handleLoadMore = () => {
    setFilters((prev) => ({ ...prev, offset: prev.offset + prev.limit }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity History</h1>
          <p className="text-muted-foreground">
            Complete history of your quotes, emails, and system events
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
          />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Filters */}
      <ActivityFilters
        filters={filters}
        onFiltersChange={(newFilters) => setFilters(newFilters)}
      />

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            All Activity
            {activities && activities.length > 0 && (
              <span className="text-muted-foreground ml-auto text-sm">
                {activities.length} items
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted h-16 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-destructive mb-4">Failed to load activity</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : !activities || activities.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Coming soon! This page will show your complete activity history
                with filtering options.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <ActivityList activities={activities || []} />

              {activities && activities.length >= filters.limit && (
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    className="w-full"
                    disabled={isLoading}
                  >
                    Load More Activity
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

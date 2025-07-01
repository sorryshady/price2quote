'use client'

import { SubscriptionLimit } from '@/components/ui/subscription-limit'

import { useAuth } from '@/hooks/use-auth'
import { useQuoteLimit } from '@/hooks/use-subscription-limits'

export default function QuotesPage() {
  const { user } = useAuth()
  const { currentQuotes, upgradeMessage, isLoading } = useQuoteLimit()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted h-5 w-64 animate-pulse rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Quotes</h1>
        <p className="text-muted-foreground">Manage and track your quotes</p>
      </div>

      {/* Show subscription limit for free users */}
      {user?.subscriptionTier === 'free' && (
        <div className="max-w-md">
          <SubscriptionLimit
            title="Quote Usage"
            description="Track your monthly quote usage"
            currentUsage={currentQuotes || 0}
            maxUsage={3}
            upgradeMessage={upgradeMessage || ''}
            onUpgrade={() => {
              // TODO: Implement upgrade flow
              console.log('Upgrade to Pro clicked')
            }}
          />
        </div>
      )}

      {/* TODO: Add quotes list component */}
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Your quotes will appear here. Create your first quote to get started.
        </p>
      </div>
    </div>
  )
}

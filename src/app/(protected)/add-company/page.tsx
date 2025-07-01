'use client'

import { SubscriptionLimit } from '@/components/ui/subscription-limit'

import { useAuth } from '@/hooks/use-auth'
import { useCompanyLimit } from '@/hooks/use-subscription-limits'

import { OnboardingForm } from './_components/onboarding-form'

export default function OnboardingPage() {
  const { user } = useAuth()
  const { canCreate, currentCompanies, upgradeMessage, isLoading } =
    useCompanyLimit()

  // Show loading while checking limits
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="bg-muted mx-auto h-9 w-64 animate-pulse rounded" />
          <div className="bg-muted mx-auto h-5 w-80 animate-pulse rounded" />
        </div>
      </div>
    )
  }

  // Show subscription limit if user can't create more companies
  if (!canCreate) {
    return (
      <div className="mx-auto max-w-md">
        <SubscriptionLimit
          title="Company Limit Reached"
          description="You've reached the maximum number of companies for your plan"
          currentUsage={currentCompanies || 0}
          maxUsage={user?.subscriptionTier === 'free' ? 1 : 5}
          upgradeMessage={upgradeMessage || ''}
          onUpgrade={() => {
            // TODO: Implement upgrade flow
            console.log('Upgrade to Pro clicked')
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <OnboardingForm />
    </div>
  )
}

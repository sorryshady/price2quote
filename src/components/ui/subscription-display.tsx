'use client'

import { IconBolt, IconCrown, IconUser } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UpgradeButton } from '@/components/ui/upgrade-button'

import { useCompanyLimit, useQuoteLimit } from '@/hooks/use-subscription-limits'
import { getSubscriptionFeatures } from '@/lib/subscription-client'
import { SubscriptionTier } from '@/types'

import { Progress } from './progress'

interface SubscriptionDisplayProps {
  currentTier: SubscriptionTier
}

export function SubscriptionDisplay({ currentTier }: SubscriptionDisplayProps) {
  const features = getSubscriptionFeatures(currentTier)
  const { currentQuotes = 0 } = useQuoteLimit()
  const { currentCompanies = 0 } = useCompanyLimit()

  const isPro = currentTier === 'pro'

  // Calculate usage percentages for progress bars
  const quotesUsagePercentage =
    features.maxQuotesPerMonth === -1
      ? 0
      : (currentQuotes / features.maxQuotesPerMonth) * 100

  const companiesUsagePercentage =
    features.maxCompanies === -1
      ? 0
      : (currentCompanies / features.maxCompanies) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPro ? (
            <IconCrown className="h-5 w-5 text-yellow-600" />
          ) : (
            <IconUser className="h-5 w-5 text-gray-600" />
          )}
          Subscription Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {isPro
                ? 'All features unlocked with unlimited usage'
                : 'Basic features with monthly limits'}
            </p>
          </div>
          <Badge
            variant={isPro ? 'default' : 'secondary'}
            className={isPro ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            {isPro ? (
              <>
                <IconCrown className="mr-1 h-3 w-3" />
                Pro
              </>
            ) : (
              'Free'
            )}
          </Badge>
        </div>

        {/* Usage Statistics */}
        <div className="space-y-4">
          <h4 className="font-medium">Usage This Month</h4>

          {/* Quotes Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Quotes</span>
              <span className="font-medium">
                {currentQuotes} of{' '}
                {features.maxQuotesPerMonth === -1
                  ? '∞'
                  : features.maxQuotesPerMonth}
              </span>
            </div>
            {features.maxQuotesPerMonth !== -1 && (
              <Progress value={quotesUsagePercentage} className="h-2" />
            )}
          </div>

          {/* Companies Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Companies</span>
              <span className="font-medium">
                {currentCompanies} of{' '}
                {features.maxCompanies === -1 ? '∞' : features.maxCompanies}
              </span>
            </div>
            {features.maxCompanies !== -1 && (
              <Progress value={companiesUsagePercentage} className="h-2" />
            )}
          </div>
        </div>

        {/* Plan Features */}
        <div className="space-y-2">
          <h4 className="font-medium">Plan Features</h4>
          <ul className="space-y-1">
            {features.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Enhanced Upgrade Section for Free Users */}
        {!isPro && (
          <div className="border-t pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconBolt className="h-4 w-4 text-amber-600" />
                <h4 className="font-medium text-amber-900">Upgrade to Pro</h4>
              </div>

              <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-amber-900">
                        $29
                        <span className="text-sm font-normal text-amber-700">
                          /month
                        </span>
                      </div>
                    </div>
                    <Badge className="border-amber-300 bg-amber-100 text-amber-800">
                      Popular
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-1 w-1 rounded-full bg-green-500" />
                      <span>5 companies</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1 w-1 rounded-full bg-green-500" />
                      <span>Unlimited quotes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1 w-1 rounded-full bg-green-500" />
                      <span>Unlimited revisions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1 w-1 rounded-full bg-green-500" />
                      <span>Priority support</span>
                    </div>
                  </div>

                  <UpgradeButton />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pro Plan Benefits */}
        {isPro && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              You&apos;re enjoying all Pro features!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

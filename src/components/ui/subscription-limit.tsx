'use client'

import { Crown, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface SubscriptionLimitProps {
  title: string
  description: string
  currentUsage: number
  maxUsage: number | string
  upgradeMessage: string
  onUpgrade?: () => void
  variant?: 'quotes' | 'companies'
}

export function SubscriptionLimit({
  title,
  description,
  currentUsage,
  maxUsage,
  upgradeMessage,
  onUpgrade,
}: SubscriptionLimitProps) {
  const isUnlimited = maxUsage === -1 || maxUsage === 'Unlimited'
  const usagePercentage = isUnlimited
    ? 0
    : (currentUsage / (maxUsage as number)) * 100

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="bg-muted mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
          <Lock className="text-muted-foreground h-6 w-6" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Usage this month</span>
            <span className="font-medium">
              {currentUsage} / {isUnlimited ? '∞' : maxUsage}
            </span>
          </div>
          {!isUnlimited && (
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Crown className="mt-0.5 h-4 w-4 text-yellow-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Upgrade to Pro</p>
              <p className="text-muted-foreground text-xs">{upgradeMessage}</p>
            </div>
          </div>
        </div>

        {onUpgrade && (
          <Button onClick={onUpgrade} className="w-full">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

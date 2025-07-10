import { Badge } from '@/components/ui/badge'
import { CancelSubscriptionButton } from '@/components/ui/cancel-subscription-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UpgradeButton } from '@/components/ui/upgrade-button'

import { getSubscriptionWithInvoicesAction } from '@/app/server-actions/subscription'

export default async function BillingPage() {
  const { subscription, payments, subscriptionTier, error } =
    await getSubscriptionWithInvoicesAction()

  if (error) {
    return (
      <div className="container mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">
              Error loading billing information: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate next billing date
  const nextBillingDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null

  // Check subscription status
  const isSubscriptionActive = subscription?.status === 'active'
  const isSubscriptionCancelled = subscription?.status === 'cancelled'
  const hasActiveSubscription =
    subscription && (isSubscriptionActive || isSubscriptionCancelled)

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view payment history
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">
                {subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </span>
              <Badge
                variant={subscriptionTier === 'pro' ? 'default' : 'secondary'}
              >
                {subscriptionTier === 'pro' && isSubscriptionCancelled
                  ? 'Expires Soon'
                  : subscriptionTier === 'pro'
                    ? 'Active'
                    : 'Free'}
              </Badge>
            </div>

            {/* Show subscription details only if user has active subscription */}
            {hasActiveSubscription && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Status:</span>
                  <span className="text-sm font-medium capitalize">
                    {subscription.status}
                  </span>
                </div>

                {/* Show next billing only for active subscriptions */}
                {isSubscriptionActive && nextBillingDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Next billing:
                    </span>
                    <span className="text-sm font-medium">
                      {nextBillingDate.toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Show access expiry for cancelled subscriptions */}
                {isSubscriptionCancelled && nextBillingDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Access expires:
                    </span>
                    <span className="text-sm font-medium">
                      {nextBillingDate.toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Show current period for any active subscription */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Current period:
                  </span>
                  <span className="text-sm font-medium">
                    {new Date(
                      subscription.currentPeriodStart,
                    ).toLocaleDateString()}{' '}
                    -{' '}
                    {new Date(
                      subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {/* Show status only for free tier users */}
            {!hasActiveSubscription && subscriptionTier === 'free' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Status:</span>
                  <span className="text-sm font-medium">Free Plan</span>
                </div>
              </div>
            )}

            {subscriptionTier === 'free' && (
              <div className="border-t pt-4">
                <p className="text-muted-foreground mb-3 text-sm">
                  Upgrade to Pro for unlimited quotes and advanced features
                </p>
                <UpgradeButton />
              </div>
            )}

            {subscriptionTier === 'pro' &&
              subscription &&
              isSubscriptionActive && (
                <div className="space-y-3 border-t pt-4">
                  <div className="text-muted-foreground text-sm">
                    Need to make changes to your subscription?
                  </div>
                  <div className="flex flex-col gap-2">
                    <CancelSubscriptionButton
                      subscriptionId={subscription.dodoSubscriptionId}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

            {subscriptionTier === 'pro' && isSubscriptionCancelled && (
              <div className="space-y-3 border-t pt-4">
                <div className="text-muted-foreground text-sm">
                  Your subscription has been cancelled. You&apos;ll retain
                  access until {nextBillingDate?.toLocaleDateString()}.
                </div>
                <UpgradeButton />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Features */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Monthly Quotes</span>
                <span className="text-sm font-medium">
                  {subscriptionTier === 'pro' ? 'Unlimited' : '3'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Companies</span>
                <span className="text-sm font-medium">
                  {subscriptionTier === 'pro' ? '5' : '1'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Quote Revisions</span>
                <span className="text-sm font-medium">
                  {subscriptionTier === 'pro' ? 'Unlimited' : '2 per quote'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI-Powered Pricing</span>
                <span className="text-sm font-medium">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">PDF Export</span>
                <span className="text-sm font-medium">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Integration</span>
                <span className="text-sm font-medium">✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Priority Support</span>
                <span className="text-sm font-medium">
                  {subscriptionTier === 'pro' ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      {payments && payments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {payment.currency.toUpperCase()}{' '}
                        {(payment.amount / 100).toFixed(2)}
                      </span>
                      <Badge
                        variant={
                          payment.status === 'succeeded'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {payment.status}
                      </Badge>
                      {payment.paymentMethod && (
                        <span className="text-muted-foreground text-xs capitalize">
                          via {payment.paymentMethod}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {new Date(payment.paidAt).toLocaleDateString()} at{' '}
                      {new Date(payment.paidAt).toLocaleTimeString()}
                    </p>
                    {payment.dodoSubscriptionId && (
                      <p className="text-muted-foreground text-xs">
                        Subscription payment
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Payment History */}
      {(!payments || payments.length === 0) && subscriptionTier === 'free' && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="py-8 text-center">
              <h3 className="mb-2 text-lg font-medium">No payment history</h3>
              <p className="text-muted-foreground mb-4">
                Upgrade to Pro to start your subscription and access advanced
                features
              </p>
              <UpgradeButton />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

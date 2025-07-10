import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CancelSubscriptionButton } from '@/components/ui/cancel-subscription-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UpgradeButton } from '@/components/ui/upgrade-button'

import { getSubscriptionWithInvoicesAction } from '@/app/server-actions/subscription'

export default async function BillingPage() {
  const { subscription, invoices, subscriptionTier, error } =
    await getSubscriptionWithInvoicesAction()

  if (error) {
    return (
      <div className="container mx-auto p-6">
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view billing history
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
                {subscriptionTier === 'pro' ? 'Active' : 'Free'}
              </Badge>
            </div>

            {subscription && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Status:</span>
                  <span className="text-sm font-medium capitalize">
                    {subscription.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Next billing:
                  </span>
                  <span className="text-sm font-medium">
                    {new Date(
                      subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Billing period:
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

            {subscriptionTier === 'free' && (
              <div className="border-t pt-4">
                <p className="text-muted-foreground mb-3 text-sm">
                  Upgrade to Pro for unlimited quotes and advanced features
                </p>
                <UpgradeButton />
              </div>
            )}

            {subscriptionTier === 'pro' && subscription && (
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

      {/* Billing History */}
      {invoices && invoices.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {invoice.currency.toUpperCase()}{' '}
                        {(invoice.amount / 100).toFixed(2)}
                      </span>
                      <Badge
                        variant={
                          invoice.status === 'paid' ? 'default' : 'destructive'
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {invoice.paidAt
                        ? new Date(invoice.paidAt).toLocaleDateString()
                        : new Date(invoice.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {invoice.invoicePdfUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={invoice.invoicePdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Billing History */}
      {(!invoices || invoices.length === 0) && subscriptionTier === 'free' && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="py-8 text-center">
              <h3 className="mb-2 text-lg font-medium">No billing history</h3>
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

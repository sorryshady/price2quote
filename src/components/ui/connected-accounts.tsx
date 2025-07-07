'use client'

import { IconMail } from '@tabler/icons-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ConnectedAccount {
  provider: string
  type: string
}

interface ConnectedAccountsProps {
  connectedAccounts: ConnectedAccount[]
}

export function ConnectedAccounts({
  connectedAccounts,
}: ConnectedAccountsProps) {
  // TODO: Future Enhancement - Gmail Connections Display
  // Replace this component with a Gmail Connections section that shows:
  // 1. List of companies and their connected Gmail accounts
  // 2. For Pro users: Multiple companies with different Gmail connections
  // 3. Connection status (connected/disconnected) per company
  // 4. Last sync time for email integration
  // 5. Manage/disconnect options per company Gmail connection
  //
  // This will be more useful than OAuth sign-in methods since:
  // - Users can't have multiple sign-in methods (credentials vs OAuth are exclusive)
  // - Gmail integration is per-company and more relevant for Pro users
  // - Shows actual email sending capabilities per company

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMail className="h-5 w-5" />
          Email Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Authentication Method */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Authentication Method</h4>
          <div className="bg-muted/50 rounded-lg border p-3">
            <p className="text-sm font-medium">
              {connectedAccounts.length > 0
                ? `${connectedAccounts[0].provider.charAt(0).toUpperCase() + connectedAccounts[0].provider.slice(1)} OAuth`
                : 'Email & Password'}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Your current sign-in method for PricingGPT
            </p>
          </div>
        </div>

        {/* Gmail Integration Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <IconMail className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm">
              <p className="mb-2 font-medium text-blue-800">
                Gmail for Quote Delivery
              </p>
              <p className="mb-3 text-blue-700">
                Gmail integration is configured per-company in the Send Email
                section. This allows you to send quotes directly from your
                company&apos;s Gmail account.
              </p>
              <div className="space-y-2 text-xs text-blue-600">
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-blue-600" />
                  <span>
                    <strong>Per-Company:</strong> Each company can have its own
                    Gmail connection
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-blue-600" />
                  <span>
                    <strong>Pro Users:</strong> Multiple companies with
                    different Gmail accounts
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-blue-600" />
                  <span>
                    <strong>Configure:</strong> Go to Send Email → Connect Gmail
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

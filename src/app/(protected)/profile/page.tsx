import { redirect } from 'next/navigation'

import { AppContainer } from '@/components/app-container'
import { AccountInfo } from '@/components/ui/account-info'
import { ConnectedAccounts } from '@/components/ui/connected-accounts'
import { ProfileForm } from '@/components/ui/profile-form'
import { ProfileSecurity } from '@/components/ui/profile-security'
import { SubscriptionDisplay } from '@/components/ui/subscription-display'

import { getUserProfileAction } from '@/app/server-actions'
import { getSession } from '@/lib/auth'

export default async function ProfilePage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Get user profile data
  const result = await getUserProfileAction()

  if (!result.success || !result.user) {
    redirect('/login')
  }

  const { user, connectedAccounts, hasPassword } = result

  return (
    <AppContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Personal & Account */}
          <div className="space-y-6">
            <ProfileForm
              initialData={{
                name: user.name || '',
                email: user.email,
              }}
            />
            <AccountInfo
              user={{
                email: user.email,
                emailVerified: user.emailVerified,
              }}
            />
            <ConnectedAccounts connectedAccounts={connectedAccounts || []} />
          </div>

          {/* Right Column - Subscription & Security */}
          <div className="space-y-6">
            <SubscriptionDisplay currentTier={user.subscriptionTier} />
            <ProfileSecurity hasPassword={hasPassword || false} />
          </div>
        </div>
      </div>
    </AppContainer>
  )
}

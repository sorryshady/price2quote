'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

import { useAuth } from '@/hooks/use-auth'
import { useQuoteLimit } from '@/hooks/use-subscription-limits'

import { ProtectedContent } from './_components/protected-content'
import { AppSidebar } from './dashboard/_components/app-sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, isInitialized } = useAuth()
  const { currentQuotes } = useQuoteLimit()

  // Don't render until auth is initialized to prevent hydration issues
  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is not available
  if (!user) return null

  // Get quote usage for free users
  const quoteUsage =
    user.subscriptionTier === 'free'
      ? { current: currentQuotes || 0, max: 3 }
      : null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="m-2">
          <header className="flex h-[2rem] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[2rem]">
            <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
              <SidebarTrigger className="-ml-1" />

              {/* User Info and Subscription Status */}
              <div className="flex items-center gap-3">
                {quoteUsage && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Quotes:</span>
                    <Badge variant="outline" className="text-xs">
                      {quoteUsage.current}/{quoteUsage.max}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      user.subscriptionTier === 'pro' ? 'default' : 'secondary'
                    }
                  >
                    {user.subscriptionTier === 'pro' ? 'Pro' : 'Free'}
                  </Badge>
                </div>
              </div>
            </div>
          </header>
          <ScrollArea className="shadows h-[calc(100vh-3rem)] w-full rounded-md border p-4">
            <ProtectedContent>{children}</ProtectedContent>
          </ScrollArea>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

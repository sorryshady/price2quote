'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ContextualActionsProps {
  hasCompanies: boolean
  hasDrafts: boolean
  hasRecentQuotes: boolean
  hasUnreadMessages: boolean
  systemHealth: {
    gmailConnected: boolean
  }
}

export function ContextualActions({
  hasCompanies,
  hasDrafts,
  hasRecentQuotes,
  hasUnreadMessages,
  systemHealth,
}: ContextualActionsProps) {
  const actions = []

  // Primary actions based on state
  if (!hasCompanies) {
    actions.push({
      title: 'Set up your first company',
      description: 'Add company details to start creating quotes',
      href: '/add-company',
      variant: 'default' as const,
      icon: '🏢',
    })
  } else if (hasDrafts) {
    actions.push({
      title: 'Continue draft quotes',
      description: 'You have unfinished quotes that need attention',
      href: '/quotes?status=draft',
      variant: 'default' as const,
      icon: '📝',
    })
  } else if (hasUnreadMessages) {
    actions.push({
      title: 'Respond to messages',
      description: 'You have unread client messages',
      href: '/conversations',
      variant: 'default' as const,
      icon: '💬',
    })
  } else if (hasRecentQuotes) {
    actions.push({
      title: 'Create similar quote',
      description: 'Duplicate your latest quote with modifications',
      href: '/quotes?action=duplicate',
      variant: 'outline' as const,
      icon: '📋',
    })
  }

  // Secondary actions
  if (hasCompanies) {
    actions.push({
      title: 'Quick quote',
      description: 'Create a quote for your main company',
      href: '/new-quote',
      variant: 'outline' as const,
      icon: '⚡',
    })
  }

  if (!systemHealth.gmailConnected && hasCompanies) {
    actions.push({
      title: 'Connect Gmail',
      description: 'Send professional emails directly from the platform',
      href: '/profile',
      variant: 'outline' as const,
      icon: '📧',
    })
  }

  // Workflow shortcuts
  if (hasCompanies && hasRecentQuotes) {
    actions.push({
      title: 'Review performance',
      description: 'Check your quote acceptance rates and insights',
      href: '/analytics',
      variant: 'ghost' as const,
      icon: '📊',
    })
  }

  // Learning and help
  if (!hasRecentQuotes && hasCompanies) {
    actions.push({
      title: 'Create your first quote',
      description: 'Start with our guided quote builder',
      href: '/new-quote',
      variant: 'default' as const,
      icon: '🚀',
    })
  }

  if (actions.length === 0) {
    // Fallback actions when everything is set up
    actions.push(
      {
        title: 'Create new quote',
        description: 'Generate AI-powered pricing recommendations',
        href: '/new-quote',
        variant: 'default' as const,
        icon: '✨',
      },
      {
        title: 'View all quotes',
        description: 'Manage your quote history and status',
        href: '/quotes',
        variant: 'outline' as const,
        icon: '📄',
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎯</span>
          Suggested Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.slice(0, 4).map((action, index) => (
          <Button
            key={index}
            asChild
            variant={action.variant}
            className="h-auto w-full justify-start p-4"
          >
            <Link href={action.href}>
              <div className="flex items-start gap-3 text-left">
                <span className="flex-shrink-0 text-lg">{action.icon}</span>
                <div className="space-y-1">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-muted-foreground text-sm">
                    {action.description}
                  </div>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

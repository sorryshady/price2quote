'use client'

import Link from 'next/link'
import React from 'react'

import {
  Calendar,
  FileText,
  Inbox,
  RefreshCw,
  Send,
  Settings,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface RecentActivity {
  id: string
  type:
    | 'quote_created'
    | 'quote_status_changed'
    | 'email_sent'
    | 'email_received'
    | 'system_event'
  title: string
  description: string
  timestamp: Date
  url?: string
  metadata?: Record<string, unknown>
}

interface RecentActivityProps {
  activities: RecentActivity[]
}

const typeIcons = {
  quote_created: FileText,
  quote_status_changed: RefreshCw,
  email_sent: Send,
  email_received: Inbox,
  system_event: Settings,
}

const typeColors = {
  quote_created: 'default',
  quote_status_changed: 'secondary',
  email_sent: 'outline',
  email_received: 'outline',
  system_event: 'secondary',
} as const

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <p className="text-muted-foreground">No recent activity to show.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Recent Activity
          <Badge variant="secondary" className="ml-auto">
            Last 7 days
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors"
              >
                <div className="text-muted-foreground flex-shrink-0">
                  {React.createElement(typeIcons[activity.type], {
                    className: 'h-4 w-4',
                  })}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-medium">{activity.title}</h4>
                      <Badge
                        variant={typeColors[activity.type]}
                        className="text-xs"
                      >
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground flex-shrink-0 text-xs">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate text-sm">
                    {activity.description}
                  </p>
                  {activity.url && (
                    <Link
                      href={activity.url}
                      className="text-primary inline-block text-xs hover:underline"
                    >
                      View details →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {activities.length >= 10 && (
          <div className="mt-3 border-t pt-3">
            <Link
              href="/dashboard/activity"
              className="text-primary block w-full text-center text-sm hover:underline"
            >
              View all activity
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

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

interface Activity {
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

interface ActivityListProps {
  activities: Activity[]
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

const typeLabels = {
  quote_created: 'Quote Created',
  quote_status_changed: 'Status Changed',
  email_sent: 'Email Sent',
  email_received: 'Email Received',
  system_event: 'System Event',
}

function formatDateTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffInDays = Math.floor(diffInSeconds / 86400)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }
}

function formatFullDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
        <p className="text-muted-foreground mb-2 text-lg font-medium">
          No activity found
        </p>
        <p className="text-muted-foreground text-sm">
          Try adjusting your filters or check back later for new activity.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-4 transition-colors"
        >
          <div className="text-muted-foreground mt-1 flex-shrink-0">
            {React.createElement(typeIcons[activity.type], {
              className: 'h-4 w-4',
            })}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-medium">{activity.title}</h4>
                <Badge variant={typeColors[activity.type]} className="text-xs">
                  {typeLabels[activity.type]}
                </Badge>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-muted-foreground flex-shrink-0 text-xs">
                  {formatDateTime(activity.timestamp)}
                </span>
                <span
                  className="text-muted-foreground flex-shrink-0 text-xs"
                  title={formatFullDateTime(activity.timestamp)}
                >
                  {activity.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
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
  )
}

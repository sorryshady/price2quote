'use client'

import Link from 'next/link'
import React from 'react'

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  FileText,
  MessageSquare,
  Timer,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActionItem {
  id: string
  type:
    | 'quote_pending'
    | 'quote_revised'
    | 'conversation_unread'
    | 'follow_up'
    | 'draft_old'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  url: string
  daysAgo?: number
  metadata?: Record<string, unknown>
}

interface ActionRequiredProps {
  items: ActionItem[]
}

const priorityColors = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const

const typeIcons = {
  quote_pending: Clock,
  quote_revised: Edit3,
  conversation_unread: MessageSquare,
  follow_up: Timer,
  draft_old: FileText,
}

const typeLabels = {
  quote_pending: 'Pending Response',
  quote_revised: 'Needs Revision',
  conversation_unread: 'Unread Message',
  follow_up: 'Follow-up Needed',
  draft_old: 'Old Draft',
}

export function ActionRequired({ items }: ActionRequiredProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Action Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <p className="text-muted-foreground">
              All caught up! No action needed.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Action Required
          <Badge variant="secondary" className="ml-auto">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="hover:bg-muted/50 flex items-start justify-between rounded-lg border p-3 transition-colors"
          >
            <div className="flex flex-1 items-start gap-3">
              <div className="text-muted-foreground">
                {React.createElement(typeIcons[item.type], {
                  className: 'h-4 w-4',
                })}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">{item.title}</h4>
                  <Badge
                    variant={priorityColors[item.priority]}
                    className="text-xs"
                  >
                    {typeLabels[item.type]}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
                {item.daysAgo !== undefined && (
                  <p className="text-muted-foreground text-xs">
                    {item.daysAgo === 0 ? 'Today' : `${item.daysAgo} days ago`}
                  </p>
                )}
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={item.url}>
                {item.type === 'quote_pending' && 'Follow Up'}
                {item.type === 'quote_revised' && 'Edit Quote'}
                {item.type === 'conversation_unread' && 'Read'}
                {item.type === 'follow_up' && 'Follow Up'}
                {item.type === 'draft_old' && 'Continue'}
              </Link>
            </Button>
          </div>
        ))}

        {items.length >= 5 && (
          <div className="border-t pt-2">
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/quotes">View All Quotes</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { Circle } from 'lucide-react'

import { Badge } from './badge'

interface UnreadEmailBadgeProps {
  isRead: boolean
  direction?: 'inbound' | 'outbound'
  count?: number
  className?: string
}

export function UnreadEmailBadge({
  isRead,
  direction = 'inbound',
  count = 1,
  className = '',
}: UnreadEmailBadgeProps) {
  // Only show badge for unread inbound emails
  if (isRead || direction !== 'inbound') {
    return null
  }

  return (
    <Badge variant="destructive" className={`gap-1 ${className}`}>
      <Circle className="h-2 w-2 fill-current" />
      <span className="text-xs">
        {count > 1 ? `${count} unread` : 'Unread'}
      </span>
    </Badge>
  )
}

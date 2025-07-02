import { Circle } from 'lucide-react'

import { Badge } from './badge'

interface UnreadEmailBadgeProps {
  isRead: boolean
  className?: string
}

export function UnreadEmailBadge({
  isRead,
  className = '',
}: UnreadEmailBadgeProps) {
  if (isRead) {
    return null
  }

  return (
    <Badge variant="destructive" className={`gap-1 ${className}`}>
      <Circle className="h-2 w-2 fill-current" />
      <span className="text-xs">Unread</span>
    </Badge>
  )
}

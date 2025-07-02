import { Eye, EyeOff, Reply } from 'lucide-react'

import { Button } from './button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'

interface EmailActionsProps {
  emailId: string
  isRead: boolean
  onMarkAsRead: (emailId: string) => void
  onMarkAsUnread: (emailId: string) => void
  onReply: (emailId: string) => void
  className?: string
}

export function EmailActions({
  emailId,
  isRead,
  onMarkAsRead,
  onMarkAsUnread,
  onReply,
  className = '',
}: EmailActionsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                isRead ? onMarkAsUnread(emailId) : onMarkAsRead(emailId)
              }
              className="h-8 w-8 p-0"
            >
              {isRead ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRead ? 'Mark as unread' : 'Mark as read'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(emailId)}
              className="h-8 w-8 p-0"
            >
              <Reply className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reply to email</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

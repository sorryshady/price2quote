import { RefreshCw, Wifi } from 'lucide-react'

import type { EmailSyncStatus as EmailSyncStatusType } from '@/types'

import { Badge } from './badge'
import { Button } from './button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'

interface EmailSyncStatusProps {
  syncStatus: EmailSyncStatusType | null
  onSyncClick: () => void
  isSyncing?: boolean
}

export function EmailSyncStatus({
  syncStatus,
  onSyncClick,
  isSyncing = false,
}: EmailSyncStatusProps) {
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const getSyncStatusColor = () => {
    if (!syncStatus?.syncEnabled) return 'text-gray-400'
    if (isSyncing) return 'text-blue-500'

    const lastSync = syncStatus.lastSyncAt
    if (!lastSync) return 'text-yellow-500'

    const now = new Date()
    const diffMs = now.getTime() - lastSync.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins > syncStatus.syncFrequencyMinutes * 2) return 'text-red-500'
    if (diffMins > syncStatus.syncFrequencyMinutes) return 'text-yellow-500'

    return 'text-green-500'
  }

  const isEnabled = syncStatus?.syncEnabled ?? true

  return (
    <div className="bg-card flex w-full flex-col gap-2 rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`rounded-full p-2 ${isEnabled ? 'bg-green-100' : 'bg-gray-100'}`}
        >
          <Wifi className={`h-4 w-4 ${getSyncStatusColor()}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">Email Sync</span>
            <Badge
              variant={isEnabled ? 'default' : 'secondary'}
              className="text-xs"
            >
              {isEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-muted-foreground truncate text-sm">
            Last sync: {formatLastSync(syncStatus?.lastSyncAt || null)}
          </p>
        </div>
      </div>

      {isEnabled ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onSyncClick}
                disabled={isSyncing}
                className="flex size-9 items-center justify-center sm:size-auto"
                aria-label={isSyncing ? 'Syncing...' : 'Sync Now'}
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manually sync incoming emails</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onSyncClick}
                disabled={true}
                className="flex size-9 items-center justify-center sm:size-auto"
                aria-label="Sync Disabled"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Sync Disabled</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Email sync is disabled for this company</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

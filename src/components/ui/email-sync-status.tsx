import { RefreshCw, Settings, Wifi } from 'lucide-react'

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
  onSettingsClick: () => void
  isSyncing?: boolean
}

export function EmailSyncStatus({
  syncStatus,
  onSyncClick,
  onSettingsClick,
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
    if (!syncStatus?.syncEnabled) return 'text-gray-500'
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

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Wifi className={`h-4 w-4 ${getSyncStatusColor()}`} />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Email Sync</span>
            <Badge
              variant={syncStatus?.syncEnabled ? 'default' : 'secondary'}
              className="text-xs"
            >
              {syncStatus?.syncEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Last sync: {formatLastSync(syncStatus?.lastSyncAt || null)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onSyncClick}
                disabled={isSyncing || !syncStatus?.syncEnabled}
                className="gap-1"
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Sync Now
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manually sync incoming emails</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettingsClick}
                className="gap-1"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sync settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface QuoteVersionIndicatorProps {
  versionNumber?: string | number
  isLatest?: boolean
  revisionNotes?: string
  className?: string
}

export function QuoteVersionIndicator({
  versionNumber,
  isLatest = false,
  revisionNotes,
  className = '',
}: QuoteVersionIndicatorProps) {
  const version = versionNumber ? String(versionNumber) : '1'
  const isRevision = Number(version) > 1

  if (!isRevision) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            <Badge variant="secondary" className="text-xs">
              v{version}
            </Badge>
            {isLatest && (
              <Badge
                variant="default"
                className="bg-green-100 text-xs text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                Latest
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium">Version {version}</p>
            {revisionNotes && (
              <p className="mt-1 text-sm text-white">{revisionNotes}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

import { ArrowDown, ArrowUp, Mail } from 'lucide-react'

import type { EmailDirection } from '@/types'

import { Badge } from './badge'

interface EmailDirectionIndicatorProps {
  direction: EmailDirection
  className?: string
}

export function EmailDirectionIndicator({
  direction,
  className = '',
}: EmailDirectionIndicatorProps) {
  const getDirectionConfig = (dir: EmailDirection) => {
    switch (dir) {
      case 'inbound':
        return {
          icon: ArrowDown,
          label: 'Inbound',
          variant: 'secondary' as const,
          color: 'text-blue-600',
        }
      case 'outbound':
        return {
          icon: ArrowUp,
          label: 'Outbound',
          variant: 'default' as const,
          color: 'text-green-600',
        }
      default:
        return {
          icon: Mail,
          label: 'Unknown',
          variant: 'outline' as const,
          color: 'text-gray-600',
        }
    }
  }

  const config = getDirectionConfig(direction)
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`gap-1 ${className}`}>
      <Icon className={`h-3 w-3 ${config.color}`} />
      <span className="text-xs">{config.label}</span>
    </Badge>
  )
}

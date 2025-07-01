import type React from 'react'

import { cn } from '@/lib/utils'

export const AppContainer = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return <div className={cn('container mx-auto', className)}>{children}</div>
}

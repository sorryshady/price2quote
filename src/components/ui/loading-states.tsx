import { Loader2 } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  text = 'Loading...',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={`text-primary animate-spin ${sizeClasses[size]}`} />
        {text && <p className="text-muted-foreground text-sm">{text}</p>}
      </div>
    </div>
  )
}

interface SkeletonLoaderProps {
  lines?: number
  className?: string
}

export function SkeletonLoader({
  lines = 3,
  className = '',
}: SkeletonLoaderProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-5 w-64 animate-pulse rounded" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-muted h-32 animate-pulse rounded" />
        <div className="bg-muted h-32 animate-pulse rounded" />
        <div className="bg-muted h-32 animate-pulse rounded" />
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-muted h-8 animate-pulse rounded" />
      <div className="space-y-2">
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
        <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
        <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
      </div>
      <div className="space-y-2">
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
        <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
      </div>
    </div>
  )
}

export function AddCompanySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-5 w-64 animate-pulse rounded" />
      </div>

      <div className="space-y-4">
        <div className="bg-muted h-32 animate-pulse rounded" />
        <div className="bg-muted h-32 animate-pulse rounded" />
        <div className="bg-muted h-32 animate-pulse rounded" />
      </div>

      <div className="flex justify-end gap-3">
        <div className="bg-muted h-10 w-24 animate-pulse rounded" />
        <div className="bg-muted h-10 w-32 animate-pulse rounded" />
      </div>
    </div>
  )
}

export function QuotesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="bg-muted h-6 w-20 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
          <div className="flex items-center gap-4">
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
            <div className="bg-muted h-4 w-20 animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="bg-muted h-8 w-20 animate-pulse rounded" />
            <div className="bg-muted h-8 w-24 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

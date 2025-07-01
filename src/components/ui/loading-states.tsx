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
      <Skeleton className="h-8 w-48" />
      <div className="rounded-lg border p-4">
        <Skeleton className="mb-2 h-6 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

export function AddCompanySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-9 w-64" />
        <Skeleton className="mx-auto h-5 w-80" />
      </div>
      <div className="space-y-6">
        <div className="mx-auto flex w-full max-w-xl items-center justify-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="h-8 w-8 rounded-full" />
              {i < 3 && <Skeleton className="ml-2 h-0.5 w-8" />}
            </div>
          ))}
        </div>
        <div className="text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto mt-2 h-5 w-64" />
        </div>
        <div className="mx-auto max-w-5xl rounded-lg border p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

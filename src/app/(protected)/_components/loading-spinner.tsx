import { Loader2 } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

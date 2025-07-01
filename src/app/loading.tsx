'use client'

import { Loader2 } from 'lucide-react'

import { AppContainer } from '@/components/app-container'

export default function Loading() {
  return (
    <AppContainer>
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    </AppContainer>
  )
}

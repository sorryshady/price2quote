'use client'

import { useRouter } from 'next/navigation'

import { AppContainer } from '@/components/app-container'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }
  const handleHome = () => {
    router.push('/')
  }

  return (
    <AppContainer>
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="relative mb-8">
          <div className="animate-bounce text-9xl">404</div>
          <div className="bg-primary absolute -bottom-2 left-1/2 h-1 w-24 -translate-x-1/2"></div>
        </div>

        <h1 className="mb-4 text-3xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Oops! The page you&apos;re looking for seems to have vanished into
          thin air. Let&apos;s get you back on track.
        </p>

        <div className="flex gap-4">
          <Button onClick={handleHome} variant="default" size="lg">
            Go Home
          </Button>
          <Button onClick={handleBack} variant="outline" size="lg">
            Go Back
          </Button>
        </div>
      </div>
    </AppContainer>
  )
}

'use client'

import { Button } from '@/components/ui/button'

interface StepServicesProps {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onPrevious: () => void
}

export function StepServices({ onNext, onPrevious }: StepServicesProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Services</h3>
        <p className="text-muted-foreground">
          Add the services you offer with skill levels and pricing
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground text-center">
          Services management interface coming soon...
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  )
}

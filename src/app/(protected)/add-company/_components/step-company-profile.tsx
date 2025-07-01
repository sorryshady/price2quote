'use client'

import { Button } from '@/components/ui/button'

interface StepCompanyProfileProps {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onPrevious: () => void
}

export function StepCompanyProfile({
  onNext,
  onPrevious,
}: StepCompanyProfileProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Company Profile</h3>
        <p className="text-muted-foreground">
          Add your company description, logo, and contact information
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground text-center">
          Logo upload and company profile form coming soon...
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

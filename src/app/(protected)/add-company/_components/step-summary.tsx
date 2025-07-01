'use client'

import { Button } from '@/components/ui/button'

interface StepSummaryProps {
  formData: any
  onPrevious: () => void
}

export function StepSummary({ onPrevious }: StepSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Review & Complete</h3>
        <p className="text-muted-foreground">
          Review your information and generate AI summary
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground text-center">
          Summary review and AI generation coming soon...
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button>Complete Setup</Button>
      </div>
    </div>
  )
}

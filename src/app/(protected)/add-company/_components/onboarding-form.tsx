'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'

import { STORAGE_KEY } from './step-company-info'
import { StepCompanyInfo } from './step-company-info'
import { StepCompanyProfile } from './step-company-profile'
import { StepServices } from './step-services'
import { StepSummary } from './step-summary'

type OnboardingStep =
  | 'company-info'
  | 'company-profile'
  | 'services'
  | 'summary'

const steps: { id: OnboardingStep; title: string; description: string }[] = [
  {
    id: 'company-info',
    title: 'Company Information',
    description: 'Basic details about your company',
  },
  {
    id: 'company-profile',
    title: 'Company Profile',
    description: 'Logo, description, and contact information',
  },
  {
    id: 'services',
    title: 'Services',
    description: 'Add the services you offer',
  },
  {
    id: 'summary',
    title: 'Review & Complete',
    description: 'Review your information and generate AI summary',
  },
]

export function OnboardingForm() {
  // On mount, read currentStep from localStorage
  const getInitialStep = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (
            parsed.currentStep &&
            steps.some((s) => s.id === parsed.currentStep)
          ) {
            return parsed.currentStep
          }
        } catch {}
      }
    }
    return 'company-info'
  }

  const [currentStep, setCurrentStep] =
    useState<OnboardingStep>(getInitialStep())
  const [formData, setFormData] = useState({
    companyInfo: {},
    companyProfile: {},
    services: [],
  })

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
      // Save currentStep to localStorage
      const draft = localStorage.getItem(STORAGE_KEY)
      const parsed = draft ? JSON.parse(draft) : {}
      parsed.currentStep = steps[nextIndex].id
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    }
  }

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
      // Save currentStep to localStorage
      const draft = localStorage.getItem(STORAGE_KEY)
      const parsed = draft ? JSON.parse(draft) : {}
      parsed.currentStep = steps[prevIndex].id
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    }
  }

  const updateFormData = (step: string, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [step]: data,
    }))
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'company-info':
        return (
          <StepCompanyInfo
            data={formData.companyInfo}
            onUpdate={(data) => updateFormData('companyInfo', data)}
            onNext={handleNext}
          />
        )
      case 'company-profile':
        return (
          <StepCompanyProfile
            data={formData.companyProfile}
            onUpdate={(data) => updateFormData('companyProfile', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 'services':
        return (
          <StepServices
            data={formData.services}
            onUpdate={(data) => updateFormData('services', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 'summary':
        return <StepSummary formData={formData} onPrevious={handlePrevious} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="mx-auto flex w-full max-w-xl items-center justify-center">
        {steps.map((step, index) => (
          <>
            <div
              key={step.id}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
                index <= currentStepIndex
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                key={`line-${index}`}
                className={`h-0.5 flex-1 ${
                  index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </>
        ))}
      </div>

      {/* Step titles */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold">
          {steps[currentStepIndex].title}
        </h2>
        <p className="text-muted-foreground">
          {steps[currentStepIndex].description}
        </p>
      </div>

      {/* Step content */}
      <Card className="mx-auto max-w-5xl">
        <CardContent className="pt-6">{renderCurrentStep()}</CardContent>
      </Card>
    </div>
  )
}

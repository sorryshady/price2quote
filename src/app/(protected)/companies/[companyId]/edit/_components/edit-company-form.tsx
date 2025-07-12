'use client'

import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'

import toast from 'react-hot-toast'

import { Card, CardContent } from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'

import { updateCompanyAction } from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'
import type { CompanyWithServices, Service } from '@/types'

// Temporary placeholder components - will be created next
const EditStepCompanyInfo = () => (
  <div>Company Info Step - Component to be created</div>
)
const EditStepCompanyProfile = () => (
  <div>Company Profile Step - Component to be created</div>
)
const EditStepServices = () => (
  <div>Services Step - Component to be created</div>
)

type EditStep = 'company-info' | 'company-profile' | 'services'

const steps: { id: EditStep; title: string; description: string }[] = [
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
    description: 'Manage the services you offer',
  },
]

interface EditCompanyFormProps {
  company: CompanyWithServices
}

export function EditCompanyForm({ company }: EditCompanyFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { refetch } = useCompaniesQuery()
  const [currentStep, setCurrentStep] = useState<EditStep>('company-info')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    companyInfo: {},
    companyProfile: {},
    services: [] as Service[],
  })

  // Pre-populate form data with existing company data
  useEffect(() => {
    if (company) {
      setFormData({
        companyInfo: {
          name: company.name,
          country: company.country,
          businessType: company.businessType,
          currency: company.currency,
        },
        companyProfile: {
          description: company.description || '',
          address: company.address || '',
          phone: company.phone || '',
          email: company.email || '',
          website: company.website || '',
          logoUrl: company.logoUrl || '',
        },
        services: company.services || [],
      })
    }
  }, [company])

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const updateFormData = (step: string, data: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [step]: data,
    }))
  }

  const handleSave = async () => {
    if (!user?.id) {
      toast.custom(
        <CustomToast message="Please log in to save changes" type="error" />,
      )
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateCompanyAction({
        userId: user.id,
        companyId: company.id,
        companyInfo: formData.companyInfo as {
          name: string
          country: string
          businessType: 'freelancer' | 'company'
          currency: string
        },
        companyProfile: formData.companyProfile as {
          description: string
          logo?: string
          address?: string
          phone?: string
          email?: string
          website?: string
        },
      })

      if (result.success) {
        toast.custom(
          <CustomToast message="Company updated successfully" type="success" />,
        )
        refetch()
        router.push(`/companies/${company.id}`)
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to update company'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error updating company:', error)
      toast.custom(
        <CustomToast message="Failed to update company" type="error" />,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'company-info':
        return <EditStepCompanyInfo />
      case 'company-profile':
        return <EditStepCompanyProfile />
      case 'services':
        return <EditStepServices />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="mx-auto flex w-full max-w-xl items-center justify-center">
        {steps.map((step, index) => (
          <Fragment key={step.id}>
            <div
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                index <= currentStepIndex
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground text-muted-foreground hover:border-primary/50'
              }`}
              onClick={() => setCurrentStep(step.id)}
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
          </Fragment>
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

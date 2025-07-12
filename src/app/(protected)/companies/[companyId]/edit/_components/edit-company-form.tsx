'use client'

import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'

import toast from 'react-hot-toast'

import { Card, CardContent } from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'

import {
  updateCompanyAction,
  updateCompanyServicesAction,
} from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'
import type { CompanyWithServices, Service } from '@/types'

import { EditStepCompanyInfo } from './edit-step-company-info'
import { EditStepCompanyProfile } from './edit-step-company-profile'
import { EditStepServices } from './edit-step-services'

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
      // Save company info and profile
      const companyResult = await updateCompanyAction({
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

      if (!companyResult.success) {
        toast.custom(
          <CustomToast
            message={companyResult.error || 'Failed to update company'}
            type="error"
          />,
        )
        return
      }

      // Save services if there are any
      if (formData.services && formData.services.length > 0) {
        const servicesWithNames = formData.services.filter(
          (service) => service.name && service.name.trim() !== '',
        )

        if (servicesWithNames.length > 0) {
          const servicesResult = await updateCompanyServicesAction({
            userId: user.id,
            companyId: company.id,
            services: servicesWithNames.map((service) => ({
              id: service.id,
              name: service.name,
              description: service.description || '',
              skillLevel: service.skillLevel,
              basePrice: service.basePrice || '',
            })),
          })

          if (!servicesResult.success) {
            toast.custom(
              <CustomToast
                message={servicesResult.error || 'Failed to update services'}
                type="error"
              />,
            )
            return
          }
        }
      }

      toast.custom(
        <CustomToast message="Company updated successfully" type="success" />,
      )
      refetch()
      router.push(`/companies/${company.id}`)
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
        return (
          <EditStepCompanyInfo
            data={formData.companyInfo}
            onUpdate={(data) => updateFormData('companyInfo', data)}
            onNext={handleNext}
            onSave={handleSave}
            isSubmitting={isSubmitting}
          />
        )
      case 'company-profile':
        return (
          <EditStepCompanyProfile
            data={formData.companyProfile}
            onUpdate={(data) => updateFormData('companyProfile', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSave={handleSave}
            isSubmitting={isSubmitting}
          />
        )
      case 'services':
        return (
          <EditStepServices
            data={formData.services}
            onUpdate={(data) => updateFormData('services', data)}
            onPrevious={handlePrevious}
            onSave={handleSave}
            isSubmitting={isSubmitting}
          />
        )
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

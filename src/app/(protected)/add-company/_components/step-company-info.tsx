'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { BusinessType } from '@/types'

const companyInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  country: z.string().min(1, 'Country is required'),
  businessType: z.enum(['freelancer', 'company'] as const),
})

type CompanyInfoForm = z.infer<typeof companyInfoSchema>

interface StepCompanyInfoProps {
  data: Partial<CompanyInfoForm>
  onUpdate: (data: CompanyInfoForm) => void
  onNext: () => void
}

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  // Add more countries as needed
]

export function StepCompanyInfo({
  data,
  onUpdate,
  onNext,
}: StepCompanyInfoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      name: data.name || '',
      country: data.country || '',
      businessType: data.businessType || 'freelancer',
    },
  })

  const onSubmit = async (formData: CompanyInfoForm) => {
    setIsSubmitting(true)
    try {
      onUpdate(formData)
      onNext()
    } catch (error) {
      console.error('Error saving company info:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Company Name</Label>
          <Input
            id="name"
            placeholder="Enter your company name"
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-sm">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={form.watch('country')}
            onValueChange={(value) => form.setValue('country', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.country && (
            <p className="text-destructive text-sm">
              {form.formState.errors.country.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType">Business Type</Label>
          <Select
            value={form.watch('businessType')}
            onValueChange={(value: BusinessType) =>
              form.setValue('businessType', value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="freelancer">Freelancer</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.businessType && (
            <p className="text-destructive text-sm">
              {form.formState.errors.businessType.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Next'}
        </Button>
      </div>
    </form>
  )
}

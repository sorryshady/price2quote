'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Controller } from 'react-hook-form'
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

import { getPopularCountries, getPopularCurrencies } from '@/lib/data-utils'

// Get comprehensive currency data with popular ones first
const currencies = getPopularCurrencies()

const companyInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  country: z.string().min(1, 'Country is required'),
  businessType: z.enum(['freelancer', 'company'] as const),
  currency: z.string().min(1, 'Preferred currency is required'),
})

type CompanyInfoForm = z.infer<typeof companyInfoSchema>

interface StepCompanyInfoProps {
  data: Partial<CompanyInfoForm>
  onUpdate: (data: CompanyInfoForm) => void
  onNext: () => void
}

// Get comprehensive country data with popular ones first
const countries = getPopularCountries()

export const STORAGE_KEY = 'company-setup-draft'

export function StepCompanyInfo({
  data,
  onUpdate,
  onNext,
}: StepCompanyInfoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const form = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      name: data.name || '',
      country: data.country || '',
      businessType: data.businessType || 'freelancer',
      currency: data.currency || 'USD',
    },
  })

  // Hydrate from localStorage on mount, then render form
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.companyInfo) {
          form.reset(parsed.companyInfo)
        }
      } catch {}
    }
    setHydrated(true)
  }, [])

  const onSubmit = async (formData: CompanyInfoForm) => {
    setIsSubmitting(true)
    try {
      // Save to localStorage only on Next, and save current step
      const draft = localStorage.getItem(STORAGE_KEY)
      const parsed = draft ? JSON.parse(draft) : {}
      parsed.companyInfo = formData
      parsed.currentStep = 'company-profile'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))

      onUpdate(formData)
      onNext()
    } catch (error) {
      console.error('Error saving company info:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hydrated)
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-5">
        <Loader2 className="text-muted-foreground h-10 w-10 animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="mb-1">
            Company Name
          </Label>
          <Input
            id="name"
            placeholder="Enter your company name"
            {...form.register('name')}
            className="mt-1"
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-sm">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className="mb-1">
            Country
          </Label>
          <Controller
            control={form.control}
            name="country"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1 w-full">
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
            )}
          />
          {form.formState.errors.country && (
            <p className="text-destructive text-sm">
              {form.formState.errors.country.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType" className="mb-1">
            Business Type
          </Label>
          <Controller
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.businessType && (
            <p className="text-destructive text-sm">
              {form.formState.errors.businessType.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency" className="mb-1">
            Preferred Currency
          </Label>
          <Controller
            control={form.control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.currency && (
            <p className="text-destructive text-sm">
              {form.formState.errors.currency.message}
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

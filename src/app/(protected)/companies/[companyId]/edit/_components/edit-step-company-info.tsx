'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
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
const countries = getPopularCountries()

const companyInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  country: z.string().min(1, 'Country is required'),
  businessType: z.enum(['freelancer', 'company'] as const),
  currency: z.string().min(1, 'Preferred currency is required'),
})

type CompanyInfoForm = z.infer<typeof companyInfoSchema>

interface EditStepCompanyInfoProps {
  data: Partial<CompanyInfoForm>
  onUpdate: (data: CompanyInfoForm) => void
  onNext: () => void
  onSave: () => Promise<void>
  isSubmitting: boolean
}

export function EditStepCompanyInfo({
  data,
  onUpdate,
  onNext,
  onSave,
  isSubmitting,
}: EditStepCompanyInfoProps) {
  const [hydrated, setHydrated] = useState(false)

  const form = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      name: '',
      country: '',
      businessType: 'freelancer',
      currency: 'USD',
    },
  })

  // Set hydrated after mount to prevent SSR mismatch
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Update form when data changes
  useEffect(() => {
    if (data && hydrated && Object.keys(data).length > 0) {
      // Small delay to ensure form is ready
      setTimeout(() => {
        // Ensure we have valid values before resetting
        const formValues = {
          name: data.name || '',
          country: data.country || '',
          businessType:
            (data.businessType as 'freelancer' | 'company') || 'freelancer',
          currency: data.currency || 'USD',
        }

        form.reset(formValues)
      }, 100)
    }
  }, [data, form, hydrated])

  const handleFormChange = (formData: CompanyInfoForm) => {
    onUpdate(formData)
  }

  const onSubmit = async (formData: CompanyInfoForm) => {
    handleFormChange(formData)
    await onSave()
  }

  const handleNext = () => {
    const formData = form.getValues()
    if (form.formState.isValid) {
      handleFormChange(formData)
      onNext()
    }
  }

  if (!hydrated) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-5">
        <Loader2 className="text-muted-foreground h-10 w-10 animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

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
            onChange={(e) => {
              form.setValue('name', e.target.value)
              if (form.formState.isValid) {
                handleFormChange(form.getValues())
              }
            }}
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
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  const formData = { ...form.getValues(), country: value }
                  if (form.formState.isValid) {
                    handleFormChange(formData)
                  }
                }}
              >
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
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  const formData = {
                    ...form.getValues(),
                    businessType: value as 'freelancer' | 'company',
                  }
                  if (form.formState.isValid) {
                    handleFormChange(formData)
                  }
                }}
              >
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
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  const formData = { ...form.getValues(), currency: value }
                  if (form.formState.isValid) {
                    handleFormChange(formData)
                  }
                }}
              >
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

      <div className="flex justify-between">
        <div /> {/* Spacer */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleNext}
            disabled={!form.formState.isValid}
          >
            Next Step
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

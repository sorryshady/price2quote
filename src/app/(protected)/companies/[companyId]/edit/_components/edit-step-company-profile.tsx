'use client'

import Image from 'next/image'
import { ChangeEvent, useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Loader2, Save } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { Textarea } from '@/components/ui/textarea'

const companyProfileSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  website: z.string().optional(),
  logo: z.string().optional(), // base64 string
})

type CompanyProfileForm = z.infer<typeof companyProfileSchema>

interface EditStepCompanyProfileProps {
  data: Partial<CompanyProfileForm & { logoUrl?: string }>
  onUpdate: (data: CompanyProfileForm) => void
  onNext: () => void
  onPrevious: () => void
  onSave: () => Promise<void>
  isSubmitting: boolean
}

export function EditStepCompanyProfile({
  data,
  onUpdate,
  onNext,
  onPrevious,
  onSave,
  isSubmitting,
}: EditStepCompanyProfileProps) {
  const [hydrated, setHydrated] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)

  const form = useForm<CompanyProfileForm>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      description: data.description || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      logo: data.logo || '',
    },
  })

  // Set hydrated after mount to prevent SSR mismatch
  useEffect(() => {
    setHydrated(true)
    // Set initial logo preview from existing logoUrl
    if (data.logoUrl) {
      setLogoPreview(data.logoUrl)
    }
  }, [data.logoUrl])

  // Update form when data changes
  useEffect(() => {
    if (data && hydrated) {
      form.reset({
        description: data.description || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        logo: data.logo || '',
      })
    }
  }, [data, form, hydrated])

  // Handle logo file select
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLogoError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      setLogoError('Logo must be less than 4MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setLogoPreview(base64)
      form.setValue('logo', base64)

      // Update parent form data
      const formData = form.getValues()
      formData.logo = base64
      onUpdate(formData)
    }
    reader.readAsDataURL(file)
  }

  const handleFormChange = (formData: CompanyProfileForm) => {
    onUpdate(formData)
  }

  const onSubmit = async (formData: CompanyProfileForm) => {
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

  const handlePrevious = () => {
    const formData = form.getValues()
    handleFormChange(formData)
    onPrevious()
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
          <Label htmlFor="description">Company Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your company..."
            {...form.register('description')}
            rows={4}
            onChange={(e) => {
              form.setValue('description', e.target.value)
              if (form.formState.isValid) {
                handleFormChange(form.getValues())
              }
            }}
          />
          {form.formState.errors.description && (
            <p className="text-destructive text-sm">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Company Logo (optional, max 4MB)</Label>
          <div className="flex items-center gap-4">
            <label className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm">
              <ImagePlus className="h-5 w-5" />
              <span>Upload Logo</span>
              <input
                id="logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </label>
            {logoPreview && (
              <Image
                src={logoPreview}
                alt="Logo preview"
                className="h-16 w-20 rounded border object-cover"
                width={80}
                height={64}
                unoptimized
              />
            )}
          </div>
          {logoError && <p className="text-destructive text-sm">{logoError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Address"
            {...form.register('address')}
            onChange={(e) => {
              form.setValue('address', e.target.value)
              if (form.formState.isValid) {
                handleFormChange(form.getValues())
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <PhoneInput
                placeholder="Enter phone number"
                value={field.value}
                onChange={(value) => {
                  field.onChange(value)
                  const formData = { ...form.getValues(), phone: value }
                  if (form.formState.isValid) {
                    handleFormChange(formData)
                  }
                }}
                defaultCountry="US"
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="company@example.com"
            {...form.register('email')}
            onChange={(e) => {
              form.setValue('email', e.target.value)
              if (form.formState.isValid) {
                handleFormChange(form.getValues())
              }
            }}
          />
          {form.formState.errors.email && (
            <p className="text-destructive text-sm">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            placeholder="https://example.com"
            {...form.register('website')}
            onChange={(e) => {
              form.setValue('website', e.target.value)
              if (form.formState.isValid) {
                handleFormChange(form.getValues())
              }
            }}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={handlePrevious}>
          Previous
        </Button>
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

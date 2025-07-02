'use client'

import Image from 'next/image'
import { ChangeEvent, useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { STORAGE_KEY } from './step-company-info'

const companyProfileSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  website: z.string().optional(),
  logo: z.string().optional(), // base64 string
})

type CompanyProfileForm = z.infer<typeof companyProfileSchema>

interface StepCompanyProfileProps {
  data: Partial<CompanyProfileForm>
  onUpdate: (data: CompanyProfileForm) => void
  onNext: () => void
  onPrevious: () => void
}

export function StepCompanyProfile({
  data,
  onUpdate,
  onNext,
  onPrevious,
}: StepCompanyProfileProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.companyProfile) {
          form.reset(parsed.companyProfile)
          if (parsed.companyProfile.logo) {
            setLogoPreview(parsed.companyProfile.logo)
            form.setValue('logo', parsed.companyProfile.logo)
          }
        }
      } catch {}
    }
    setHydrated(true)
  }, [])

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
      // Immediately update localStorage with new logo
      const formData = form.getValues()
      formData.logo = base64
      const draft = localStorage.getItem(STORAGE_KEY)
      const parsed = draft ? JSON.parse(draft) : {}
      parsed.companyProfile = formData
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (formData: CompanyProfileForm) => {
    setIsSubmitting(true)
    try {
      // Save to localStorage and set current step
      const draft = localStorage.getItem(STORAGE_KEY)
      const parsed = draft ? JSON.parse(draft) : {}
      parsed.companyProfile = formData
      parsed.currentStep = 'services'
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))

      onUpdate(formData)
      onNext()
    } catch (error) {
      console.error('Error saving company profile:', error)
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
          <Label htmlFor="description">Company Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your company..."
            {...form.register('description')}
            rows={4}
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
            {hydrated && logoPreview && (
              <Image
                src={logoPreview}
                alt="Logo preview"
                className="h-16 w-20 rounded border object-cover"
                width={64}
                height={48}
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
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="Phone" {...form.register('phone')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="Email" {...form.register('email')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            placeholder="Website"
            {...form.register('website')}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            // Save to localStorage and set current step to previous
            const formData = form.getValues()
            const draft = localStorage.getItem(STORAGE_KEY)
            const parsed = draft ? JSON.parse(draft) : {}
            parsed.companyProfile = formData
            parsed.currentStep = 'company-info'
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
            onUpdate(formData)
            onPrevious()
          }}
        >
          Previous
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Next'}
        </Button>
      </div>
    </form>
  )
}

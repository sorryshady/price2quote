'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { generateCompanySummaryAction } from '@/app/server-actions'

import { STORAGE_KEY } from './step-company-info'

interface CompanyInfo {
  name: string
  country: string
  businessType: string
  currency: string
}

interface CompanyProfile {
  description: string
  logo?: string
  address?: string
  phone?: string
  website?: string
}

interface Service {
  name: string
  description?: string
  skillLevel: string
  basePrice?: string
  currency: string
}

interface Summary {
  companyInfo: CompanyInfo
  companyProfile: CompanyProfile
  services: Service[]
}

interface StepSummaryProps {
  onPrevious: () => void
}

export function StepSummary({ onPrevious }: StepSummaryProps) {
  const [hydrated, setHydrated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)

  // Hydrate all data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setSummary(JSON.parse(saved))
      } catch {}
    }
    setHydrated(true)
  }, [])

  const handleComplete = async () => {
    setIsSubmitting(true)

    try {
      const result = await generateCompanySummaryAction({
        name: summary?.companyInfo.name || '',
        description: summary?.companyProfile.description || '',
        businessType: summary?.companyInfo.businessType || '',
        country: summary?.companyInfo.country || '',
        currency: summary?.companyInfo.currency || '',
        services:
          summary?.services.map((service) => ({
            name: service.name,
            description: service.description,
            skillLevel: service.skillLevel,
            basePrice: service.basePrice,
          })) || [],
      })

      if (result.success) {
        console.log('Generated AI Summary:', result.summary)
        alert('AI Summary generated! Check console for results.')
      } else {
        console.error('Failed to generate summary:', result.error)
        alert('Failed to generate AI summary. Check console for details.')
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('Error generating AI summary. Check console for details.')
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

  if (!summary)
    return (
      <div className="text-muted-foreground text-center">
        No data to display.
      </div>
    )

  const { companyInfo, companyProfile, services } = summary

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="rounded border p-4">
          <h4 className="mb-2 font-semibold">Company Info</h4>
          <div>
            <b>Name:</b> {companyInfo?.name}
          </div>
          <div>
            <b>Country:</b> {companyInfo?.country}
          </div>
          <div>
            <b>Business Type:</b> {companyInfo?.businessType}
          </div>
          <div>
            <b>Preferred Currency:</b> {companyInfo?.currency}
          </div>
        </div>
        <div className="rounded border p-4">
          <h4 className="mb-2 font-semibold">Company Profile</h4>
          <div>
            <b>Description:</b> {companyProfile?.description}
          </div>
          {companyProfile?.logo && (
            <div className="mt-2">
              <b>Logo:</b>
              <Image
                src={companyProfile.logo}
                alt="Logo preview"
                className="mt-1 h-16 w-20 rounded border object-cover"
                width={64}
                height={48}
              />
            </div>
          )}
          {companyProfile?.address && (
            <div>
              <b>Address:</b> {companyProfile.address}
            </div>
          )}
          {companyProfile?.phone && (
            <div>
              <b>Phone:</b> {companyProfile.phone}
            </div>
          )}
          {companyProfile?.website && (
            <div>
              <b>Website:</b> {companyProfile.website}
            </div>
          )}
        </div>
        <div className="rounded border p-4">
          <h4 className="mb-2 font-semibold">Services</h4>
          {services && services.length > 0 ? (
            <ul className="space-y-2">
              {services.map((service: Service, idx: number) => (
                <li key={idx} className="rounded border p-2">
                  <div>
                    <b>Name:</b> {service.name}
                  </div>
                  <div>
                    <b>Skill Level:</b> {service.skillLevel}
                  </div>
                  {service.basePrice && (
                    <div>
                      <b>Base Price:</b> {service.basePrice} {service.currency}
                    </div>
                  )}
                  {service.description && (
                    <div>
                      <b>Description:</b> {service.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground">No services added.</div>
          )}
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" type="button" onClick={onPrevious}>
          Previous
        </Button>
        <Button type="button" onClick={handleComplete} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isSubmitting ? 'Generating Summary...' : 'Generate AI Summary'}
        </Button>
      </div>
    </div>
  )
}

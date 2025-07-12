'use client'

import { useEffect, useState } from 'react'

import { Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'

import { STORAGE_KEY } from './step-company-info'

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', variant: 'secondary' as const },
  { value: 'intermediate', label: 'Intermediate', variant: 'default' as const },
  { value: 'advanced', label: 'Advanced', variant: 'destructive' as const },
]

interface Service {
  name: string
  description?: string
  skillLevel: string
  basePrice?: string
  currency: string
}

interface StepServicesProps {
  data: Service[]
  onUpdate: (data: Service[]) => void
  onNext: () => void
  onPrevious: () => void
}

export function StepServices({
  data,
  onUpdate,
  onNext,
  onPrevious,
}: StepServicesProps) {
  const [hydrated, setHydrated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<Service>({
    name: '',
    description: '',
    skillLevel: '',
    basePrice: '',
    currency: 'USD', // will be set from companyInfo
  })
  const [error, setError] = useState<string | null>(null)

  // Helper to get preferred currency from localStorage
  const getPreferredCurrency = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.companyInfo && parsed.companyInfo.currency) {
          return parsed.companyInfo.currency
        }
      } catch {}
    }
    return 'USD'
  }

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const preferredCurrency = getPreferredCurrency()
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.services) {
          setServices(parsed.services)
        } else if (data) {
          setServices(data)
        }
      } catch {
        setServices(data || [])
      }
    } else {
      setServices(data || [])
    }
    // Set default currency for new service form
    setForm((f) => ({ ...f, currency: preferredCurrency }))
    setHydrated(true)
  }, [data])

  // Add or update service
  const handleSave = () => {
    setError(null)
    if (!form.name.trim()) {
      setError('Service name is required')
      return
    }
    if (!form.skillLevel) {
      setError('Skill level is required')
      return
    }
    let updatedServices: Service[]
    if (editingIndex !== null) {
      const updated = [...services]
      updated[editingIndex] = { ...form, currency: form.currency }
      setServices(updated)
      updatedServices = updated
      setEditingIndex(null)
    } else {
      if (services.length >= 20) {
        setError('You can add up to 20 services only')
        return
      }
      updatedServices = [...services, { ...form, currency: form.currency }]
      setServices(updatedServices)
    }
    // Always reset to preferred currency
    setForm((f) => ({
      ...f,
      name: '',
      description: '',
      skillLevel: '',
      basePrice: '',
      currency: getPreferredCurrency(),
    }))
    // Save to localStorage after add/edit
    const draft = localStorage.getItem(STORAGE_KEY)
    const parsed = draft ? JSON.parse(draft) : {}
    parsed.services = updatedServices
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  }

  // Edit service
  const handleEdit = (idx: number) => {
    setEditingIndex(idx)
    setForm(services[idx])
  }

  // Remove service
  const handleRemove = (idx: number) => {
    const updated = services.filter((_, i) => i !== idx)
    setServices(updated)
    setEditingIndex(null)
    setForm({
      name: '',
      description: '',
      skillLevel: '',
      basePrice: '',
      currency: getPreferredCurrency(),
    })
    // Save to localStorage after remove
    const draft = localStorage.getItem(STORAGE_KEY)
    const parsed = draft ? JSON.parse(draft) : {}
    parsed.services = updated
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  }

  // Save to localStorage and go to next step
  const handleNext = () => {
    setIsSubmitting(true)
    const draft = localStorage.getItem(STORAGE_KEY)
    const parsed = draft ? JSON.parse(draft) : {}
    parsed.services = services
    parsed.currentStep = 'summary'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    onUpdate(services)
    onNext()
    setIsSubmitting(false)
  }

  // Save to localStorage and go to previous step
  const handlePrevious = () => {
    const draft = localStorage.getItem(STORAGE_KEY)
    const parsed = draft ? JSON.parse(draft) : {}
    parsed.services = services
    parsed.currentStep = 'company-profile'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    onUpdate(services)
    onPrevious()
  }

  if (!hydrated)
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-5">
        <Loader2 className="text-muted-foreground h-10 w-10 animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Services</h3>
        <p className="text-muted-foreground">
          Add the services you offer with skill levels and pricing (max 20)
        </p>
      </div>
      <div className="space-y-4">
        {services.length > 0 && (
          <ul className="space-y-2">
            {services.map((service, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 rounded border p-2"
              >
                <div className="flex-1">
                  <div className="font-semibold">{service.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {service.skillLevel}{' '}
                    {service.basePrice &&
                      `| ${service.basePrice} ${service.currency}`}
                  </div>
                  {service.description && (
                    <div className="text-muted-foreground mt-1 text-xs">
                      {service.description}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => handleEdit(idx)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  type="button"
                  onClick={() => handleRemove(idx)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-3 rounded border p-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="service-name" className="mb-1">
                Service Name
              </Label>
              <Input
                id="service-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Web Development"
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="service-skill" className="mb-1">
                Skill Level
              </Label>
              <Select
                value={form.skillLevel}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, skillLevel: val }))
                }
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((lvl) => (
                    <SelectItem key={lvl.value} value={lvl.value}>
                      <Badge variant={lvl.variant}>{lvl.label}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="service-desc" className="mb-1">
              Description
            </Label>
            <Textarea
              placeholder="Describe this service... (optional)"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="service-price" className="mb-1">
                Base Price
              </Label>
              <Input
                id="service-price"
                type="number"
                value={form.basePrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, basePrice: e.target.value }))
                }
                placeholder="Optional"
                min={0}
                className="mt-1"
              />
            </div>
            <div className="flex flex-1 items-end">
              <span className="text-muted-foreground ml-2">
                Currency: <span className="font-semibold">{form.currency}</span>
              </span>
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            {editingIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingIndex(null)
                  setForm({
                    name: '',
                    description: '',
                    skillLevel: '',
                    basePrice: '',
                    currency: getPreferredCurrency(),
                  })
                }}
              >
                Cancel
              </Button>
            )}
            <Button type="button" onClick={handleSave}>
              {editingIndex !== null ? 'Update Service' : 'Add Service'}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" type="button" onClick={handlePrevious}>
          Previous
        </Button>
        <Button type="button" onClick={handleNext} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Next'}
        </Button>
      </div>
    </div>
  )
}

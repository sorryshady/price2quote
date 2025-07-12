'use client'

import { useEffect, useState } from 'react'

import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomToast } from '@/components/ui/custom-toast'
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

import { updateCompanyServicesAction } from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'
import type { Service } from '@/types'

interface EditStepServicesProps {
  data: Service[]
  companyId: string
  onUpdate: (data: Service[]) => void
  onPrevious: () => void
  onSave: () => Promise<void>
  isSubmitting: boolean
}

interface ServiceForm {
  id?: string
  name: string
  description: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
  basePrice: string
}

export function EditStepServices({
  data,
  companyId,
  onUpdate,
  onPrevious,
  onSave,
  isSubmitting,
}: EditStepServicesProps) {
  const { user } = useAuth()
  const { refetch } = useCompaniesQuery()
  const [services, setServices] = useState<ServiceForm[]>([])
  const [isUpdatingServices, setIsUpdatingServices] = useState(false)

  // Initialize services from data
  useEffect(() => {
    if (data && data.length > 0) {
      setServices(
        data.map((service) => ({
          id: service.id,
          name: service.name,
          description: service.description || '',
          skillLevel: service.skillLevel,
          basePrice: service.basePrice || '',
        })),
      )
    } else {
      // Start with one empty service if none exist
      setServices([
        {
          name: '',
          description: '',
          skillLevel: 'intermediate',
          basePrice: '',
        },
      ])
    }
  }, [data])

  const addService = () => {
    setServices([
      ...services,
      {
        name: '',
        description: '',
        skillLevel: 'intermediate',
        basePrice: '',
      },
    ])
  }

  const removeService = (index: number) => {
    const newServices = services.filter((_, i) => i !== index)
    setServices(newServices)
    onUpdate(newServices as Service[])
  }

  const updateService = (
    index: number,
    field: keyof ServiceForm,
    value: string,
  ) => {
    const newServices = [...services]
    newServices[index] = { ...newServices[index], [field]: value }
    setServices(newServices)
    onUpdate(newServices as Service[])
  }

  const handleSaveServices = async () => {
    if (!user?.id) {
      toast.custom(
        <CustomToast message="Please log in to save services" type="error" />,
      )
      return
    }

    setIsUpdatingServices(true)
    try {
      const result = await updateCompanyServicesAction({
        userId: user.id,
        companyId,
        services: services.filter((s) => s.name.trim() !== ''), // Only save services with names
      })

      if (result.success) {
        toast.custom(
          <CustomToast
            message="Services updated successfully"
            type="success"
          />,
        )
        refetch()
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to update services'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error updating services:', error)
      toast.custom(
        <CustomToast message="Failed to update services" type="error" />,
      )
    } finally {
      setIsUpdatingServices(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {services.map((service, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Service {index + 1}</CardTitle>
                {services.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input
                    placeholder="e.g., Web Development"
                    value={service.name}
                    onChange={(e) =>
                      updateService(index, 'name', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Skill Level</Label>
                  <Select
                    value={service.skillLevel}
                    onValueChange={(value) =>
                      updateService(index, 'skillLevel', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Beginner</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="intermediate">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Intermediate</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="advanced">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">Advanced</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe this service..."
                  value={service.description}
                  onChange={(e) =>
                    updateService(index, 'description', e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Base Price (optional)</Label>
                <Input
                  placeholder="e.g., 1000"
                  type="number"
                  value={service.basePrice}
                  onChange={(e) =>
                    updateService(index, 'basePrice', e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addService}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Service
        </Button>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={handleSaveServices}
            disabled={isUpdatingServices}
            variant="outline"
          >
            {isUpdatingServices ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Services...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Services Only
              </>
            )}
          </Button>
          <Button type="button" onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving All...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

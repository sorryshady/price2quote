'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { createQuoteAction } from '@/app/server-actions'
import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'
import { useQuoteLimit } from '@/hooks/use-subscription-limits'
import type { Service } from '@/types'

const quoteSchema = z.object({
  companyId: z.string().min(1, 'Please select a company'),
  projectTitle: z.string().min(1, 'Project title is required'),
  projectDescription: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  currency: z.string(),
})

type QuoteFormData = z.infer<typeof quoteSchema>

interface SelectedService {
  serviceId: string
  service: Service
  quantity: number
  unitPrice: number
  notes: string
}

export default function NewQuotePage() {
  const { user } = useAuth()
  const { companies } = useCompaniesQuery()
  const { canCreate, currentQuotes, upgradeMessage } = useQuoteLimit()
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    [],
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      currency: 'USD',
    },
  })

  const selectedCompanyId = form.watch('companyId')
  const selectedCompany = companies?.find((c) => c.id === selectedCompanyId)

  const handleServiceToggle = (service: Service) => {
    setSelectedServices((prev) => {
      const existing = prev.find((s) => s.serviceId === service.id)
      if (existing) {
        return prev.filter((s) => s.serviceId !== service.id)
      } else {
        return [
          ...prev,
          {
            serviceId: service.id,
            service,
            quantity: 1,
            unitPrice: parseFloat(service.basePrice || '0'),
            notes: '',
          },
        ]
      }
    })
  }

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, quantity } : s)),
    )
  }

  const updateServicePrice = (serviceId: string, price: number) => {
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.serviceId === serviceId ? { ...s, unitPrice: price } : s,
      ),
    )
  }

  const updateServiceNotes = (serviceId: string, notes: string) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, notes } : s)),
    )
  }

  const calculateTotal = () => {
    return selectedServices.reduce((sum, service) => {
      return sum + service.quantity * service.unitPrice
    }, 0)
  }

  const onSubmit = async (data: QuoteFormData) => {
    if (!user || !canCreate) return

    setIsSubmitting(true)
    try {
      const result = await createQuoteAction({
        userId: user.id,
        companyId: data.companyId,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        clientEmail: data.clientEmail,
        clientName: data.clientName,
        currency: data.currency,
        selectedServices: selectedServices.map((s) => ({
          serviceId: s.serviceId,
          quantity: s.quantity,
          unitPrice: s.unitPrice,
          notes: s.notes,
        })),
      })

      if (result.success) {
        // Reset form and redirect
        form.reset()
        setSelectedServices([])
        // TODO: Redirect to quotes page or show success message
      } else {
        // TODO: Show error message
        console.error('Failed to create quote:', result.error)
      }
    } catch (error) {
      console.error('Error creating quote:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if user can create quotes
  if (!canCreate) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">New Quote</h1>
          <p className="text-muted-foreground">
            You&apos;ve reached your quote limit for this month.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Quote Limit Reached</CardTitle>
            <CardDescription>
              You&apos;ve used {currentQuotes} of 3 quotes this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              {upgradeMessage}
            </p>
            <Button>Upgrade to Pro</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">New Quote</h1>
        <p className="text-muted-foreground">
          Create a new quote for your client
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Company</CardTitle>
              <CardDescription>
                Select the company to create the quote for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies?.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Basic information about the project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="projectTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the project requirements..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Services Selection */}
          {selectedCompany && (
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>
                  Select the services to include in this quote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCompany.services?.map((service) => (
                  <div key={service.id} className="flex items-center space-x-4">
                    <Switch
                      checked={selectedServices.some(
                        (s) => s.serviceId === service.id,
                      )}
                      onCheckedChange={() => handleServiceToggle(service)}
                    />
                    <div className="flex-1">
                      <Label className="text-sm font-medium">
                        {service.name}
                      </Label>
                      {service.description && (
                        <p className="text-muted-foreground text-sm">
                          {service.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline">{service.skillLevel}</Badge>
                        {service.basePrice && (
                          <Badge variant="secondary">
                            ${service.basePrice} {service.currency}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Selected Services Details */}
          {selectedServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quote Details</CardTitle>
                <CardDescription>
                  Configure quantities and pricing for selected services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedServices.map((selectedService) => (
                  <div
                    key={selectedService.serviceId}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {selectedService.service.name}
                      </h4>
                      <Badge variant="outline">
                        {selectedService.service.skillLevel}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">Quantity</Label>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={selectedService.quantity}
                          onChange={(e) =>
                            updateServiceQuantity(
                              selectedService.serviceId,
                              parseFloat(e.target.value) || 1,
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={selectedService.unitPrice}
                          onChange={(e) =>
                            updateServicePrice(
                              selectedService.serviceId,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Total</Label>
                        <Input
                          value={`$${(selectedService.quantity * selectedService.unitPrice).toFixed(2)}`}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Notes</Label>
                      <Textarea
                        placeholder="Add any specific notes for this service..."
                        value={selectedService.notes}
                        onChange={(e) =>
                          updateServiceNotes(
                            selectedService.serviceId,
                            e.target.value,
                          )
                        }
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>
                Optional client details for the quote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || selectedServices.length === 0}
            >
              {isSubmitting ? 'Creating Quote...' : 'Create Quote'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

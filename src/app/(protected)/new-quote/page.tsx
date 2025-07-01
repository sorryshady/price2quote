'use client'

import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AIQuoteRecommendations } from '@/components/ui/ai-quote-recommendations'
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
import { LoadingSpinner } from '@/components/ui/loading-states'
import { QuotePreview } from '@/components/ui/quote-preview'
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

import {
  createQuoteAction,
  generateAIAssistedQuoteAction,
  generateFinalQuoteAction,
  negotiatePriceAction,
} from '@/app/server-actions'
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
  clientLocation: z.string().min(1, 'Client location is required'),
  deliveryTimeline: z.enum([
    '1_week',
    '2_weeks',
    '1_month',
    '2_months',
    '3_months',
    'custom',
  ]),
  customTimeline: z.string().optional(),
  clientBudget: z.number().min(0).optional(),
  projectComplexity: z.enum(['simple', 'moderate', 'complex']),
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
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
  const [showQuotePreview, setShowQuotePreview] = useState(false)
  const [finalQuoteData, setFinalQuoteData] = useState<{
    quoteDocument: {
      executiveSummary: string
      serviceBreakdown: Array<{
        serviceName: string
        description: string
        quantity: number
        unitPrice: number
        totalPrice: number
        deliverables: string[]
      }>
      termsAndConditions: string[]
      paymentTerms: string
      deliveryTimeline: string
      nextSteps: string
    }
    presentation: {
      keyHighlights: string[]
      valueProposition: string
      competitiveAdvantages: string[]
    }
  } | null>(null)
  const [aiResponse, setAiResponse] = useState<{
    marketAnalysis: {
      locationFactor: string
      marketConditions: string
      competitivePosition: string
    }
    serviceRecommendations: Array<{
      serviceName: string
      currentPrice: number
      recommendedPrice: number
      confidenceLevel: 'high' | 'medium' | 'low'
      reasoning: string
      priceRange: {
        min: number
        max: number
      }
    }>
    totalQuote: {
      currentTotal: number
      recommendedTotal: number
      confidenceLevel: 'high' | 'medium' | 'low'
      reasoning: string
    }
    negotiationTips: string[]
  } | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      companyId: '',
      projectTitle: '',
      projectDescription: '',
      clientName: '',
      clientEmail: '',
      clientLocation: '',
      deliveryTimeline: '1_month',
      customTimeline: '',
      clientBudget: undefined,
      projectComplexity: 'moderate',
      currency: 'USD',
    },
  })

  const selectedCompanyId = form.watch('companyId')
  const selectedCompany = companies?.find((c) => c.id === selectedCompanyId)

  // Auto-select company for free users and update currency
  useEffect(() => {
    if (
      user?.subscriptionTier === 'free' &&
      companies?.length === 1 &&
      !form.getValues('companyId')
    ) {
      form.setValue('companyId', companies[0].id)
    }
  }, [companies, user?.subscriptionTier, form])

  // Update currency when company changes
  useEffect(() => {
    if (selectedCompany?.services?.[0]?.currency) {
      form.setValue('currency', selectedCompany.services[0].currency)
    }
  }, [selectedCompany, form])

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

  // Get the current currency from selected company
  const currentCurrency = selectedCompany?.services?.[0]?.currency || 'USD'

  // Format currency display
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ${currentCurrency}`
  }

  const handleGenerateAIQuote = async () => {
    if (!selectedCompany || selectedServices.length === 0) return

    setIsGeneratingAI(true)
    try {
      const formData = form.getValues()
      const result = await generateAIAssistedQuoteAction({
        companyId: formData.companyId,
        projectTitle: formData.projectTitle,
        projectDescription: formData.projectDescription,
        complexity: formData.projectComplexity,
        deliveryTimeline: formData.deliveryTimeline,
        customTimeline: formData.customTimeline,
        clientLocation: formData.clientLocation,
        clientBudget: formData.clientBudget,
        selectedServices: selectedServices.map((s) => ({
          serviceId: s.serviceId,
          serviceName: s.service.name,
          skillLevel: s.service.skillLevel,
          basePrice: s.service.basePrice,
          quantity: s.quantity,
          currentPrice: s.unitPrice,
        })),
      })

      if (result.success && result.aiResponse) {
        setAiResponse(result.aiResponse)
        setShowAIRecommendations(true)
      } else {
        console.error('Failed to generate AI quote:', result.error)
      }
    } catch (error) {
      console.error('Error generating AI quote:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleApplyAIRecommendations = (
    recommendations: Array<{
      serviceName: string
      currentPrice: number
      recommendedPrice: number
      confidenceLevel: 'high' | 'medium' | 'low'
      reasoning: string
      priceRange: {
        min: number
        max: number
      }
    }>,
  ) => {
    console.log('Applying recommendations:', recommendations)
    console.log('Current selected services:', selectedServices)

    setSelectedServices((prev) => {
      const updated = prev.map((service) => {
        const recommendation = recommendations.find(
          (r) => r.serviceName === service.service.name,
        )
        if (recommendation) {
          console.log(
            `Updating ${service.service.name} from ${service.unitPrice} to ${recommendation.recommendedPrice}`,
          )
          return {
            ...service,
            unitPrice: recommendation.recommendedPrice,
          }
        }
        return service
      })
      console.log('Updated services:', updated)
      return updated
    })
    setShowAIRecommendations(false)
  }

  const handleNegotiate = async (negotiationData: {
    serviceName: string
    proposedPrice: number
    reasoning: string
  }) => {
    if (!selectedCompany || !aiResponse) return

    try {
      const formData = form.getValues()
      const service = aiResponse.serviceRecommendations.find(
        (s) => s.serviceName === negotiationData.serviceName,
      )

      if (!service) return

      const result = await negotiatePriceAction({
        companyId: formData.companyId,
        serviceName: negotiationData.serviceName,
        currentRecommendedPrice: service.recommendedPrice,
        proposedPrice: negotiationData.proposedPrice,
        userReasoning: negotiationData.reasoning,
        priceRange: service.priceRange,
        projectData: {
          title: formData.projectTitle,
          description: formData.projectDescription,
          complexity: formData.projectComplexity,
          deliveryTimeline: formData.deliveryTimeline,
          customTimeline: formData.customTimeline,
          clientLocation: formData.clientLocation,
          clientBudget: formData.clientBudget,
        },
      })

      if (result.success && result.aiResponse) {
        // Update the AI response with negotiation feedback
        setAiResponse((prev) => {
          if (!prev) return prev

          return {
            ...prev,
            serviceRecommendations: prev.serviceRecommendations.map((s) => {
              if (s.serviceName === negotiationData.serviceName) {
                return {
                  ...s,
                  recommendedPrice:
                    result.aiResponse.recommendation.suggestedPrice,
                  confidenceLevel:
                    result.aiResponse.recommendation.confidenceLevel,
                  reasoning: result.aiResponse.recommendation.reasoning,
                }
              }
              return s
            }),
          }
        })
      } else {
        console.error('Failed to negotiate price:', result.error)
      }
    } catch (error) {
      console.error('Error negotiating price:', error)
    }
  }

  const handleGenerateFinalQuote = async (finalData: {
    services: Array<{
      serviceName: string
      currentPrice: number
      recommendedPrice: number
      confidenceLevel: 'high' | 'medium' | 'low'
      reasoning: string
      priceRange: {
        min: number
        max: number
      }
    }>
    totalAmount: number
    notes: string
  }) => {
    if (!selectedCompany) return

    try {
      const formData = form.getValues()
      const result = await generateFinalQuoteAction({
        companyId: formData.companyId,
        projectData: {
          title: formData.projectTitle,
          description: formData.projectDescription,
          complexity: formData.projectComplexity,
          deliveryTimeline: formData.deliveryTimeline,
          customTimeline: formData.customTimeline,
          clientLocation: formData.clientLocation,
          clientBudget: formData.clientBudget,
        },
        finalData: {
          services: finalData.services.map((s) => ({
            serviceName: s.serviceName,
            finalPrice: s.recommendedPrice,
            quantity:
              selectedServices.find((ss) => ss.service.name === s.serviceName)
                ?.quantity || 1,
            totalPrice:
              (selectedServices.find((ss) => ss.service.name === s.serviceName)
                ?.quantity || 1) * s.recommendedPrice,
          })),
          totalAmount: finalData.totalAmount,
          notes: finalData.notes,
        },
      })

      if (result.success && result.aiResponse) {
        setFinalQuoteData(result.aiResponse)
        setShowQuotePreview(true)
        setShowAIRecommendations(false)
      } else {
        console.error('Failed to generate final quote:', result.error)
      }
    } catch (error) {
      console.error('Error generating final quote:', error)
    }
  }

  const handleSaveQuote = async () => {
    if (!user || !finalQuoteData) return

    setIsSubmitting(true)
    try {
      const formData = form.getValues()
      const result = await createQuoteAction({
        userId: user.id,
        companyId: formData.companyId,
        projectTitle: formData.projectTitle,
        projectDescription: formData.projectDescription,
        clientEmail: formData.clientEmail,
        clientName: formData.clientName,
        clientLocation: formData.clientLocation,
        deliveryTimeline: formData.deliveryTimeline,
        customTimeline: formData.customTimeline,
        clientBudget: formData.clientBudget,
        projectComplexity: formData.projectComplexity,
        currency: formData.currency,
        selectedServices: selectedServices.map((s) => ({
          serviceId: s.serviceId,
          quantity: s.quantity,
          unitPrice: s.unitPrice,
          notes: s.notes,
        })),
      })

      if (result.success) {
        // Reset form and close preview
        form.reset()
        setSelectedServices([])
        setShowQuotePreview(false)
        setFinalQuoteData(null)
        // TODO: Redirect to quotes page or show success message
      } else {
        console.error('Failed to create quote:', result.error)
      }
    } catch (error) {
      console.error('Error creating quote:', error)
    } finally {
      setIsSubmitting(false)
    }
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
        clientLocation: data.clientLocation,
        deliveryTimeline: data.deliveryTimeline,
        customTimeline: data.customTimeline,
        clientBudget: data.clientBudget,
        projectComplexity: data.projectComplexity,
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
          {/* AI Generation Loading Overlay */}
          {isGeneratingAI && (
            <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/50">
              <div className="bg-background rounded-lg p-8 text-center">
                <LoadingSpinner
                  size="lg"
                  text="Generating AI quote, please wait..."
                />
              </div>
            </div>
          )}
          {/* Company Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Company</CardTitle>
              <CardDescription>
                {user?.subscriptionTier === 'free' && companies?.length === 1
                  ? 'Your company (auto-selected)'
                  : 'Select the company to create the quote for'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.subscriptionTier === 'free' && companies?.length === 1 ? (
                <div className="bg-muted rounded-lg p-3">
                  <p className="font-medium">{companies[0].name}</p>
                  <p className="text-muted-foreground text-sm">
                    {companies[0].businessType} • {companies[0].country}
                  </p>
                </div>
              ) : (
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
              )}
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="deliveryTimeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Timeline</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timeline" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1_week">1 Week</SelectItem>
                          <SelectItem value="2_weeks">2 Weeks</SelectItem>
                          <SelectItem value="1_month">1 Month</SelectItem>
                          <SelectItem value="2_months">2 Months</SelectItem>
                          <SelectItem value="3_months">3 Months</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectComplexity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Complexity</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select complexity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="complex">Complex</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('deliveryTimeline') === 'custom' && (
                <FormField
                  control={form.control}
                  name="customTimeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Timeline</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 6 weeks, 2 months, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                      disabled={isGeneratingAI}
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
                            {formatCurrency(parseFloat(service.basePrice))}
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
                          disabled={isGeneratingAI}
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
                          disabled={isGeneratingAI}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Total</Label>
                        <Input
                          value={formatCurrency(
                            selectedService.quantity *
                              selectedService.unitPrice,
                          )}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Description</Label>
                      <Textarea
                        placeholder="Describe this service for the client..."
                        value={selectedService.notes}
                        onChange={(e) =>
                          updateServiceNotes(
                            selectedService.serviceId,
                            e.target.value,
                          )
                        }
                        className="min-h-[60px]"
                        disabled={isGeneratingAI}
                      />
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Client details for the quote</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter client name"
                          {...field}
                          disabled={isGeneratingAI}
                        />
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
                        <Input
                          placeholder="Enter client email"
                          {...field}
                          disabled={isGeneratingAI}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Location *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., San Francisco, CA"
                          {...field}
                          disabled={isGeneratingAI}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Budget (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter budget amount"
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          disabled={isGeneratingAI}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={selectedServices.length === 0 || isGeneratingAI}
              onClick={handleGenerateAIQuote}
            >
              {isGeneratingAI ? 'Generating...' : 'Get AI-Assisted Quote'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedServices.length === 0}
            >
              {isSubmitting ? 'Creating Quote...' : 'Create Quote'}
            </Button>
          </div>
        </form>
      </Form>

      {/* AI Recommendations Modal */}
      {showAIRecommendations && aiResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg">
            <div className="p-6">
              <AIQuoteRecommendations
                aiResponse={aiResponse}
                onApplyRecommendations={handleApplyAIRecommendations}
                onClose={() => setShowAIRecommendations(false)}
                onNegotiate={handleNegotiate}
                onGenerateFinalQuote={handleGenerateFinalQuote}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quote Preview Modal */}
      {showQuotePreview && finalQuoteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg">
            <div className="p-6">
              <QuotePreview
                quoteData={finalQuoteData}
                onClose={() => {
                  setShowQuotePreview(false)
                  setFinalQuoteData(null)
                }}
                onSave={handleSaveQuote}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

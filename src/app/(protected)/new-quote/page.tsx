'use client'

import { useCallback, useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Eye, FileDown, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
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
import { CustomToast } from '@/components/ui/custom-toast'
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
import {
  downloadPDF,
  generateQuoteFilename,
  generateQuotePDF,
} from '@/lib/pdf-utils'
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
  finalNotes: z.string().optional(),
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
  const queryClient = useQueryClient()
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    [],
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
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
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null)
  const [showViewQuote, setShowViewQuote] = useState(false)
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
      finalNotes: '',
    },
  })

  const selectedCompanyId = form.watch('companyId')
  const selectedCompany = companies?.find((c) => c.id === selectedCompanyId)

  // Auto-select company for free users and update currency
  useEffect(() => {
    if (
      user?.subscriptionTier === 'free' &&
      companies?.length === 1 &&
      (!form.getValues('companyId') || form.getValues('companyId') === '')
    ) {
      form.setValue('companyId', companies[0].id)
    }
  }, [companies, user?.subscriptionTier, form, selectedCompanyId])

  // Update currency when company changes
  useEffect(() => {
    if (selectedCompany?.services?.[0]?.currency) {
      form.setValue('currency', selectedCompany.services[0].currency)
    }
  }, [selectedCompany, form])

  // Check for existing quote in localStorage on page load
  useEffect(() => {
    const savedQuote = localStorage.getItem('quote')
    if (savedQuote) {
      try {
        const quoteData = JSON.parse(savedQuote)
        if (quoteData && quoteData.id) {
          setSavedQuoteId(quoteData.id)
          // Extract the AI-generated quote data if it exists
          if (quoteData.quoteData) {
            const aiData =
              typeof quoteData.quoteData === 'string'
                ? JSON.parse(quoteData.quoteData)
                : quoteData.quoteData
            setFinalQuoteData(aiData)
          }
        }
      } catch (error) {
        console.error('Error parsing saved quote from localStorage:', error)
        // Clear invalid data
        localStorage.removeItem('quote')
      }
    }
  }, [])

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

  const handleApplyAIRecommendations = useCallback(() => {
    if (!aiResponse) return

    console.log('=== APPLYING AI RECOMMENDATIONS ===')
    console.log('AI Response service recommendations:')
    aiResponse.serviceRecommendations.forEach((rec, index) => {
      console.log(
        `${index}: ${rec.serviceName} - Current: ${rec.currentPrice}, Recommended: ${rec.recommendedPrice}`,
      )
    })

    console.log('Current selected services:')
    selectedServices.forEach((service, index) => {
      console.log(
        `${index}: ${service.service.name} - Quantity: ${service.quantity}, Unit Price: ${service.unitPrice}, Total: ${service.quantity * service.unitPrice}`,
      )
    })

    setSelectedServices((prev) => {
      const updated = prev.map((service) => {
        const recommendation = aiResponse.serviceRecommendations.find((r) => {
          // Try exact match first
          if (r.serviceName === service.service.name) return true
          // Try matching without skill level suffix (e.g., "Cake Baking (advanced)" matches "Cake Baking")
          const serviceNameWithoutSuffix = service.service.name
          const recommendationNameWithoutSuffix = r.serviceName
            .replace(/\s*\([^)]+\)$/, '')
            .toLowerCase()
          return (
            serviceNameWithoutSuffix.toLowerCase() ===
            recommendationNameWithoutSuffix.toLowerCase()
          )
        })
        if (recommendation) {
          console.log(
            `✅ MATCH FOUND: Updating ${service.service.name} from ${service.unitPrice}/unit to ${recommendation.recommendedPrice}/unit`,
          )
          console.log(
            `   Quantity: ${service.quantity}, Old Total: ${service.quantity * service.unitPrice}, New Total: ${service.quantity * recommendation.recommendedPrice}`,
          )
          return {
            ...service,
            unitPrice: recommendation.recommendedPrice,
          }
        } else {
          console.log(
            `❌ NO MATCH: ${service.service.name} not found in AI recommendations`,
          )
        }
        return service
      })
      console.log('Final updated services:')
      updated.forEach((service, index) => {
        console.log(
          `${index}: ${service.service.name} - Quantity: ${service.quantity}, Unit Price: ${service.unitPrice}, Total: ${service.quantity * service.unitPrice}`,
        )
      })
      return updated
    })
    setShowAIRecommendations(false)
  }, [aiResponse, selectedServices])

  const handleNegotiate = async (negotiationData: {
    serviceName: string
    proposedPrice: number
    reasoning: string
  }) => {
    if (!selectedCompany || !aiResponse) return

    try {
      const formData = form.getValues()
      const service = aiResponse.serviceRecommendations.find((s) => {
        // Try exact match first
        if (s.serviceName === negotiationData.serviceName) return true
        // Try matching without skill level suffix
        const serviceNameWithoutSuffix = negotiationData.serviceName
        const recommendationNameWithoutSuffix = s.serviceName.replace(
          /\s*\([^)]+\)$/,
          '',
        )
        return serviceNameWithoutSuffix === recommendationNameWithoutSuffix
      })

      if (!service) return

      const result = await negotiatePriceAction({
        companyId: formData.companyId,
        serviceName: negotiationData.serviceName,
        proposedPrice: negotiationData.proposedPrice,
        reasoning: negotiationData.reasoning,
        projectContext: JSON.stringify({
          title: formData.projectTitle,
          description: formData.projectDescription,
          complexity: formData.projectComplexity,
          deliveryTimeline: formData.deliveryTimeline,
          customTimeline: formData.customTimeline,
          clientLocation: formData.clientLocation,
          clientBudget: formData.clientBudget,
          currentRecommendedPrice: service.recommendedPrice,
          priceRange: service.priceRange,
        }),
      })

      if (result.success && result.aiResponse) {
        console.log('=== NEGOTIATION SUCCESS ===')
        console.log(`Service: ${negotiationData.serviceName}`)
        console.log(`Old recommended price: ${service.recommendedPrice}/unit`)
        console.log(
          `New suggested price: ${result.aiResponse.recommendation.suggestedPrice}/unit`,
        )

        // Update the AI response with negotiation feedback
        setAiResponse((prev) => {
          if (!prev) return prev

          const updated = {
            ...prev,
            serviceRecommendations: prev.serviceRecommendations.map((s) => {
              if (s.serviceName === negotiationData.serviceName) {
                console.log(
                  `✅ UPDATING AI RESPONSE: ${s.serviceName} from ${s.recommendedPrice}/unit to ${result.aiResponse.recommendation.suggestedPrice}/unit`,
                )
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

          console.log('Updated AI response service recommendations:')
          updated.serviceRecommendations.forEach((rec, index) => {
            console.log(
              `${index}: ${rec.serviceName} - Recommended: ${rec.recommendedPrice}/unit`,
            )
          })

          return updated
        })
      } else {
        console.error('Failed to negotiate price:', result.error)
      }
    } catch (error) {
      console.error('Error negotiating price:', error)
    }
  }

  const onSubmit = async (data: QuoteFormData) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      // Always generate the final quote document
      const finalQuoteResult = await generateFinalQuoteAction({
        companyId: data.companyId,
        projectData: {
          title: data.projectTitle,
          description: data.projectDescription,
          complexity: data.projectComplexity,
          deliveryTimeline: data.deliveryTimeline,
          customTimeline: data.customTimeline,
          clientLocation: data.clientLocation,
          clientBudget: data.clientBudget,
        },
        finalData: {
          services: selectedServices.map((s) => ({
            serviceName: s.service.name,
            finalPrice: s.unitPrice,
            quantity: s.quantity,
            totalPrice: s.quantity * s.unitPrice,
          })),
          totalAmount: calculateTotal(),
          notes: data.finalNotes || '',
        },
      })

      let finalQuoteData = null
      if (finalQuoteResult.success && finalQuoteResult.aiResponse) {
        finalQuoteData = finalQuoteResult.aiResponse
      }

      // Create the quote in database with all data
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
        quoteData: finalQuoteData,
      })

      if (result.success && result.quote) {
        // Store the complete quote with company data in localStorage
        localStorage.setItem('quote', JSON.stringify(result.quote))
        setSavedQuoteId(result.quote.id)
        setFinalQuoteData(finalQuoteData)

        // Invalidate quotes query to refresh the quotes list
        await queryClient.invalidateQueries({ queryKey: ['quotes', user.id] })

        // Invalidate quote limit to update the count
        await queryClient.invalidateQueries({
          queryKey: ['quote-limit', user.id],
        })

        // Show upgrade message if this was the last free quote
        if (!canCreate) {
          toast.custom(
            <CustomToast
              message="Quote created! You've reached your free tier limit. Upgrade to Pro for unlimited quotes."
              type="info"
            />,
          )
        }

        // Don't reset form yet - let user view the quote first
      } else {
        console.error('Failed to create quote:', result.error)
      }
    } catch (error) {
      console.error('Error creating quote:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewQuote = () => {
    setShowViewQuote(true)
  }

  const handleDownloadQuote = async () => {
    const quote = JSON.parse(localStorage.getItem('quote') || '{}')
    if (!quote || Object.keys(quote).length === 0) {
      toast.custom(
        <CustomToast
          message="No quote data found. Please generate a quote first."
          type={'error'}
        />,
      )
      return
    }
    try {
      const pdfBlob = await generateQuotePDF(quote)
      const filename = generateQuoteFilename(quote)
      if (!pdfBlob || !filename) {
        toast.custom(
          <CustomToast
            message="Failed to generate PDF. Please try again."
            type={'error'}
          />,
        )
        return
      }
      downloadPDF(pdfBlob, filename)
      toast.custom(
        <CustomToast message="PDF downloaded successfully" type="success" />,
      )
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.custom(
        <CustomToast message="Failed to download PDF" type="error" />,
      )
    }
  }

  const handleResetForm = () => {
    // Store the current company ID if it's a free user with one company
    const currentCompanyId =
      user?.subscriptionTier === 'free' && companies?.length === 1
        ? companies[0].id
        : null

    form.reset()
    setSelectedServices([])
    setFinalQuoteData(null)
    setSavedQuoteId(null)
    setShowViewQuote(false)
    localStorage.removeItem('quote')

    // Re-select company for free users after reset
    if (currentCompanyId) {
      // Use setTimeout to ensure the reset has completed
      setTimeout(() => {
        form.setValue('companyId', currentCompanyId)
      }, 0)
    }
  }

  const handleFillDummyValues = () => {
    // Fill form with dummy values for birthday event
    form.setValue('projectTitle', "Sarah's 30th Birthday Celebration")
    form.setValue(
      'projectDescription',
      'Custom birthday cake and assorted pastries for a 40-guest celebration. Theme: Elegant garden party with pastel colors. Need delivery to event venue.',
    )
    form.setValue('clientName', 'Jennifer Martinez')
    form.setValue('clientEmail', 'jennifer.martinez@email.com')
    form.setValue('clientLocation', 'San Francisco, CA')
    form.setValue('deliveryTimeline', '1_week')
    form.setValue('projectComplexity', 'moderate')
    form.setValue('clientBudget', 800)
    form.setValue(
      'finalNotes',
      'Please ensure all items are nut-free due to guest allergies. Delivery needed 2 hours before event start time. Include cake stand and serving utensils.',
    )

    // Auto-select services if they exist
    if (selectedCompany?.services) {
      const cakeService = selectedCompany.services.find(
        (s) =>
          s.name.toLowerCase().includes('cake') ||
          s.name.toLowerCase().includes('pastry') ||
          s.name.toLowerCase().includes('custom'),
      )

      if (cakeService) {
        // Add cake service
        setSelectedServices([
          {
            serviceId: cakeService.id,
            service: cakeService,
            quantity: 1,
            unitPrice: parseFloat(cakeService.basePrice || '150'),
            notes:
              '3-tier custom birthday cake with garden theme, pastel colors, personalized decoration',
          },
        ])

        // Add pastry service if available
        const pastryService = selectedCompany.services.find(
          (s) =>
            s.id !== cakeService.id &&
            (s.name.toLowerCase().includes('pastries') ||
              s.name.toLowerCase().includes('pastry') ||
              s.name.toLowerCase().includes('dessert') ||
              s.name.toLowerCase().includes('assorted')),
        )

        if (pastryService) {
          setSelectedServices((prev) => [
            ...prev,
            {
              serviceId: pastryService.id,
              service: pastryService,
              quantity: 1,
              unitPrice: parseFloat(pastryService.basePrice || '8'),
              notes:
                'Assorted mini pastries (macarons, cupcakes, petit fours) - 1 per guest',
            },
          ])
        }
      }
    }
  }

  // Show upgrade prompt if user can't create more quotes and no quote is currently generated
  if (!canCreate && (!savedQuoteId || !finalQuoteData)) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">New Quote</h1>
            {user?.subscriptionTier === 'free' && (
              <Badge variant="outline" className="text-sm">
                {currentQuotes}/3 quotes used
              </Badge>
            )}
          </div>
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
        <h1 className="text-3xl font-bold">New Quote</h1>
        <p className="text-muted-foreground">
          {savedQuoteId && finalQuoteData
            ? 'Your quote has been generated successfully'
            : 'Create a new quote for your client'}
        </p>
      </div>

      {/* Show form only when no quote is generated */}
      {!savedQuoteId || !finalQuoteData ? (
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
                {user?.subscriptionTier === 'free' &&
                companies?.length === 1 ? (
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
                    <div
                      key={service.id}
                      className="flex items-center space-x-4"
                    >
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

            {/* Final Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Final Notes</CardTitle>
                <CardDescription>
                  Additional notes, terms, or special conditions for the quote
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="finalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any final notes, terms, or special conditions for this quote..."
                          className="min-h-[100px]"
                          {...field}
                          disabled={isGeneratingAI}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Warning for last free quote */}
            {user?.subscriptionTier === 'free' && currentQuotes === 2 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    This will be your last free quote. Upgrade to Pro for
                    unlimited quotes.
                  </span>
                </div>
              </div>
            )}

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
                title={
                  !canCreate
                    ? 'This will be your last free quote. Upgrade to Pro for unlimited quotes.'
                    : undefined
                }
              >
                {isSubmitting
                  ? 'Creating Quote...'
                  : !canCreate
                    ? 'Create Final Free Quote'
                    : 'Create Quote'}
              </Button>
            </div>
          </form>
        </Form>
      ) : null}

      {/* Generated Quote Section */}
      {savedQuoteId && finalQuoteData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Generated Quote</span>
              <Badge variant="outline" className="text-green-600">
                ✓ Saved
              </Badge>
            </CardTitle>
            <CardDescription>
              Your professional quote has been created and saved successfully.
              You can view, download, or create a new quote.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show limit reached UI if user has hit the limit */}
            {!canCreate && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-800">
                      Quote Limit Reached
                    </h4>
                    <p className="mt-1 text-sm text-orange-700">
                      You&apos;ve reached your free tier limit of 3 quotes.
                      Upgrade to Pro for unlimited quotes and advanced features.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                      onClick={() => {
                        // Navigate to upgrade page or show upgrade modal
                        window.open('/dashboard?upgrade=true', '_blank')
                      }}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleViewQuote} variant="outline">
                <Eye className="h-4 w-4" /> View Quote
              </Button>
              <Button onClick={handleDownloadQuote} variant="outline">
                <FileDown className="h-4 w-4" /> Download PDF
              </Button>
              <Button
                onClick={handleResetForm}
                variant="default"
                disabled={!canCreate}
                title={
                  !canCreate
                    ? 'Upgrade to Pro to create more quotes'
                    : undefined
                }
              >
                <Plus className="h-4 w-4" /> Create New Quote
              </Button>
            </div>

            {showViewQuote && (
              <div className="mt-6 border-t pt-6">
                <QuotePreview
                  quoteData={finalQuoteData}
                  onClose={() => setShowViewQuote(false)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dummy Data Button - Only show when no quote is generated */}
      {(!savedQuoteId || !finalQuoteData) && (
        <div className="mt-8 border-t pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleFillDummyValues}
            className="w-full"
          >
            🎂 Fill with Dummy Values (Birthday Event)
          </Button>
          <p className="text-muted-foreground mt-2 text-center text-xs">
            Populates form with realistic data for testing AI quote generation
          </p>
        </div>
      )}

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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

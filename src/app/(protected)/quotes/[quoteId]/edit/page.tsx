'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  File,
  FilePenLine,
  GitBranch,
  Mail,
  RefreshCw,
  Save,
  X,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

import { getConversationIdForQuoteAction } from '@/app/server-actions/email-threads'
import {
  CreateQuoteData,
  createRevisedQuoteAction,
  generateQuoteRevisionAnalysisAction,
  getQuoteForEditingAction,
} from '@/app/server-actions/quote'
import { useAuth } from '@/hooks/use-auth'
import { useCompaniesQuery } from '@/hooks/use-companies-query'
import { useRevisionLimit } from '@/hooks/use-subscription-limits'
import type { Quote, QuoteService, QuoteStatus, Service } from '@/types'

const editQuoteSchema = z.object({
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
  revisionNotes: z.string().optional(),
  clientFeedback: z.string().optional(),
})

type EditQuoteFormData = z.infer<typeof editQuoteSchema>

function getStatusColor(status: QuoteStatus) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'awaiting_client':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'under_revision':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'revised':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'expired':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getStatusIcon(status: QuoteStatus) {
  switch (status) {
    case 'draft':
      return <File className="h-4 w-4" />
    case 'awaiting_client':
      return <Mail className="h-4 w-4" />
    case 'under_revision':
      return <FilePenLine className="h-4 w-4" />
    case 'revised':
      return <RefreshCw className="h-4 w-4" />
    case 'accepted':
      return <Check className="h-4 w-4" />
    case 'rejected':
      return <X className="h-4 w-4" />
    case 'expired':
      return <GitBranch className="h-4 w-4" />
    default:
      return <File className="h-4 w-4" />
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export default function EditQuotePage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const quoteId = params?.quoteId as string
  const queryClient = useQueryClient()

  // Check revision limits
  const {
    canCreate: canRevise,
    currentRevisions,
    upgradeMessage: revisionUpgradeMessage,
  } = useRevisionLimit(quoteId)

  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editableServices, setEditableServices] = useState<
    {
      serviceId: string
      service: Service
      quantity: number
      unitPrice: number
      notes: string
    }[]
  >([])
  const [allServices, setAllServices] = useState<Service[]>([])
  const [aiAnalysis, setAiAnalysis] = useState<{
    marketAnalysis: {
      locationFactor: string
      marketConditions: string
      competitivePosition: string
      revisionContext: string
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
      revisionImpact: string
    }>
    negotiationTips: string[]
    revisionStrategy: string
  } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Get companies for services
  const { companies } = useCompaniesQuery()

  const form = useForm<EditQuoteFormData>({
    resolver: zodResolver(editQuoteSchema),
    defaultValues: {
      projectTitle: '',
      projectDescription: '',
      clientName: '',
      clientEmail: '',
      clientLocation: '',
      deliveryTimeline: '1_month',
      customTimeline: '',
      clientBudget: undefined,
      projectComplexity: 'moderate',
      revisionNotes: '',
      clientFeedback: '',
    },
  })

  useEffect(() => {
    async function fetchQuote() {
      if (!user?.id || !quoteId) return
      setLoading(true)
      const result = await getQuoteForEditingAction(quoteId, user.id)
      if (result.success && result.quote) {
        setQuote(result.quote as Quote)

        // Extract data from top-level columns first, fallback to quoteData if needed
        const extractedData: {
          clientLocation: string
          deliveryTimeline:
            | '1_week'
            | '2_weeks'
            | '1_month'
            | '2_months'
            | '3_months'
            | 'custom'
          customTimeline: string
          clientBudget: number | undefined
          projectComplexity: 'simple' | 'moderate' | 'complex'
        } = {
          clientLocation: result.quote.clientLocation || '',
          deliveryTimeline: result.quote.deliveryTimeline || '1_month',
          customTimeline: result.quote.customTimeline || '',
          clientBudget: result.quote.clientBudget
            ? Number(result.quote.clientBudget)
            : undefined,
          projectComplexity: result.quote.projectComplexity || 'moderate',
        }

        // Fallback: Try to extract data from quoteData if not present in columns
        if (result.quote.quoteData) {
          try {
            const quoteData =
              typeof result.quote.quoteData === 'string'
                ? JSON.parse(result.quote.quoteData)
                : result.quote.quoteData

            // Extract delivery timeline from quote document if not present in columns
            if (
              !result.quote.deliveryTimeline &&
              quoteData.quoteDocument?.deliveryTimeline
            ) {
              const timeline = quoteData.quoteDocument.deliveryTimeline
              if (
                timeline.includes('1 week') ||
                timeline.includes('1-2 weeks')
              ) {
                extractedData.deliveryTimeline = '1_week'
              } else if (
                timeline.includes('2 weeks') ||
                timeline.includes('2-4 weeks')
              ) {
                extractedData.deliveryTimeline = '2_weeks'
              } else if (
                timeline.includes('1 month') ||
                timeline.includes('1-2 months')
              ) {
                extractedData.deliveryTimeline = '1_month'
              } else if (
                timeline.includes('2 months') ||
                timeline.includes('2-3 months')
              ) {
                extractedData.deliveryTimeline = '2_months'
              } else if (
                timeline.includes('3 months') ||
                timeline.includes('3-6 months')
              ) {
                extractedData.deliveryTimeline = '3_months'
              } else {
                extractedData.deliveryTimeline = 'custom'
                extractedData.customTimeline = timeline
              }
            }
          } catch (error) {
            console.error('Error parsing quote data:', error)
          }
        }

        // Reset form with all the data
        form.reset({
          projectTitle: result.quote.projectTitle || '',
          projectDescription: result.quote.projectDescription || '',
          clientName: result.quote.clientName || '',
          clientEmail: result.quote.clientEmail || '',
          clientLocation: extractedData.clientLocation,
          deliveryTimeline: extractedData.deliveryTimeline,
          customTimeline: extractedData.customTimeline,
          clientBudget: extractedData.clientBudget,
          projectComplexity: extractedData.projectComplexity,
          revisionNotes: result.quote.revisionNotes || '',
          clientFeedback: result.quote.clientFeedback || '',
        })

        // Fetch conversation ID for the quote
        const conversationResult =
          await getConversationIdForQuoteAction(quoteId)
        if (conversationResult.success && conversationResult.conversationId) {
          setConversationId(conversationResult.conversationId)
        }
      } else {
        setError(result.error || 'Failed to load quote.')
      }
      setLoading(false)
    }
    fetchQuote()
  }, [user?.id, quoteId, form])

  // Get all services for the company (for Add Service)
  useEffect(() => {
    if (!quote?.companyId || !companies) return

    // Find the company and get its services
    const company = companies.find((c) => c.id === quote.companyId)
    if (company?.services) {
      setAllServices(company.services)
    }
  }, [quote?.companyId, companies])

  // Initialize editableServices from quote
  useEffect(() => {
    if (quote && quote.quoteServices) {
      setEditableServices(
        (quote.quoteServices as QuoteService[])
          .filter((qs) => qs.service)
          .map((qs) => ({
            serviceId: qs.serviceId,
            service: qs.service as Service,
            quantity: Number(qs.quantity),
            unitPrice: qs.unitPrice ? Number(qs.unitPrice) : 0,
            notes: qs.notes || '',
          })),
      )
    }
  }, [quote])

  // Add Service
  const handleAddService = (service: Service) => {
    setEditableServices((prev) => [
      ...prev,
      {
        serviceId: service.id,
        service,
        quantity: 1,
        unitPrice: parseFloat(service.basePrice || '0'),
        notes: '',
      },
    ])
  }

  // Remove Service
  const handleRemoveService = (serviceId: string) => {
    setEditableServices((prev) => prev.filter((s) => s.serviceId !== serviceId))
  }

  // Update Service Quantity
  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    setEditableServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, quantity } : s)),
    )
  }

  // Update Service Price
  const updateServicePrice = (serviceId: string, price: number) => {
    setEditableServices((prev) =>
      prev.map((s) =>
        s.serviceId === serviceId ? { ...s, unitPrice: price } : s,
      ),
    )
  }

  // Update Service Notes
  const updateServiceNotes = (serviceId: string, notes: string) => {
    setEditableServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, notes } : s)),
    )
  }

  // Calculate total
  const calculateTotal = () => {
    return editableServices.reduce(
      (sum, s) => sum + s.quantity * s.unitPrice,
      0,
    )
  }

  // AI Re-analysis function
  const handleReanalyzeWithAI = async () => {
    if (!quote || editableServices.length === 0) return

    setIsAnalyzing(true)
    try {
      const formData = form.getValues()

      // Get previous quote services for context
      const previousServices = (quote.quoteServices as QuoteService[])
        .filter((qs) => qs.service)
        .map((qs) => ({
          serviceName: (qs.service as Service).name,
          quantity: Number(qs.quantity),
          unitPrice: qs.unitPrice ? Number(qs.unitPrice) : 0,
          totalPrice: qs.totalPrice ? Number(qs.totalPrice) : 0,
        }))

      const result = await generateQuoteRevisionAnalysisAction({
        companyId: quote.companyId,
        projectTitle: formData.projectTitle,
        projectDescription: formData.projectDescription,
        complexity: formData.projectComplexity,
        deliveryTimeline: formData.deliveryTimeline,
        customTimeline: formData.customTimeline,
        clientLocation: formData.clientLocation,
        clientBudget: formData.clientBudget,
        clientFeedback: formData.clientFeedback || '',
        revisionNotes: formData.revisionNotes || '',
        currentServices: editableServices.map((s) => ({
          serviceId: s.serviceId,
          serviceName: s.service.name,
          skillLevel: s.service.skillLevel,
          quantity: s.quantity,
          currentPrice: s.unitPrice,
        })),
        previousQuoteData: {
          amount: quote.amount || '0',
          services: previousServices,
          status: quote.status,
          versionNumber: quote.versionNumber
            ? Number(quote.versionNumber)
            : undefined,
        },
      })

      if (result.success && result.aiResponse) {
        setAiAnalysis(result.aiResponse)
        setShowAIRecommendations(true)
        toast.custom(
          <CustomToast
            message="AI revision analysis completed! Review recommendations below."
            type="success"
          />,
        )
      } else {
        toast.custom(
          <CustomToast
            message={result.error || 'Failed to generate AI revision analysis'}
            type="error"
          />,
        )
      }
    } catch (error) {
      console.error('Error generating AI revision analysis:', error)
      toast.custom(
        <CustomToast
          message="Failed to generate AI revision analysis"
          type="error"
        />,
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Apply AI recommendations
  const handleApplyAIRecommendations = () => {
    if (!aiAnalysis) return

    setEditableServices((prev) => {
      const updated = prev.map((service) => {
        const recommendation = aiAnalysis.serviceRecommendations.find((r) => {
          // Try exact match first
          if (r.serviceName === service.service.name) return true
          // Try matching without skill level suffix
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
          return {
            ...service,
            unitPrice: recommendation.recommendedPrice,
          }
        }
        return service
      })
      return updated
    })

    setShowAIRecommendations(false)
    toast.custom(
      <CustomToast
        message="AI recommendations applied to service prices!"
        type="success"
      />,
    )
  }

  const onSubmit = async (data: EditQuoteFormData) => {
    if (!user?.id || !quote) return
    setSubmitting(true)

    const result = await createRevisedQuoteAction({
      originalQuoteId: quote.id,
      userId: user.id,
      companyId: quote.companyId,
      projectTitle: data.projectTitle,
      projectDescription: data.projectDescription,
      clientName: data.clientName || undefined,
      clientEmail: data.clientEmail || undefined,
      clientLocation: data.clientLocation,
      deliveryTimeline: data.deliveryTimeline,
      customTimeline: data.customTimeline || undefined,
      clientBudget: data.clientBudget,
      projectComplexity: data.projectComplexity,
      currency: quote.currency,
      selectedServices: editableServices.map((s) => ({
        serviceId: s.serviceId,
        quantity: s.quantity,
        unitPrice: s.unitPrice,
        notes: s.notes,
      })),
      revisionNotes: data.revisionNotes || '',
      clientFeedback: data.clientFeedback || '',
      quoteData: quote.quoteData as CreateQuoteData['quoteData'],
    })

    setSubmitting(false)
    if (result.success) {
      // Invalidate quotes queries to refresh the quotes list
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quotes', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['latest-quotes', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['quote-limit', user.id] }),
      ])

      toast.custom(
        <CustomToast message="Quote revised successfully!" type="success" />,
      )
      router.push('/quotes')
    } else {
      toast.custom(
        <CustomToast
          message={result.error || 'Failed to revise quote.'}
          type="error"
        />,
      )
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="space-y-6">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-32 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="text-center">
          <div className="mb-4 text-red-600">{error}</div>
          <Button asChild>
            <Link href="/quotes">Back to Quotes</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="text-center">
          <div className="mb-4">Quote not found.</div>
          <Button asChild>
            <Link href="/quotes">Back to Quotes</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold">Edit Quote</h1>
        <p className="text-muted-foreground">
          Revise quote for {quote.clientName || quote.clientEmail}
        </p>
      </div>

      <div className="flex items-center justify-between">
        {conversationId ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/conversations/${conversationId}`}>
              View Conversation
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled>
            No Conversation Found
          </Button>
        )}
      </div>

      {/* Quote Information Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Original Quote Details</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(quote.status)}>
                {getStatusIcon(quote.status)} {quote.status}
              </Badge>
              {quote.versionNumber && Number(quote.versionNumber) > 1 && (
                <Badge variant="secondary">Version {quote.versionNumber}</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground text-sm font-medium">
                Project
              </Label>
              <p className="font-medium">{quote.projectTitle}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm font-medium">
                Company
              </Label>
              <p className="font-medium">{quote.company?.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm font-medium">
                Client
              </Label>
              <p className="font-medium">
                {quote.clientName || quote.clientEmail}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm font-medium">
                Created
              </Label>
              <p className="font-medium">{formatDate(quote.createdAt)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm font-medium">
                Amount
              </Label>
              <p className="font-medium">
                {quote.currency} {quote.amount}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm font-medium">
                Services
              </Label>
              <p className="font-medium">
                {quote.quoteServices?.length || 0} services
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editableServices.map((s) => (
                <div key={s.serviceId} className="mb-4 space-y-2 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{s.service.name}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveService(s.serviceId)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm">Quantity</Label>
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={s.quantity}
                        onChange={(e) =>
                          updateServiceQuantity(
                            s.serviceId,
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
                        value={s.unitPrice}
                        onChange={(e) =>
                          updateServicePrice(
                            s.serviceId,
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Total</Label>
                      <Input
                        value={(s.quantity * s.unitPrice).toFixed(2)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Notes</Label>
                    <Textarea
                      value={s.notes}
                      onChange={(e) =>
                        updateServiceNotes(s.serviceId, e.target.value)
                      }
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              ))}
              {/* Add Service Dropdown */}
              {allServices.filter(
                (s) => !editableServices.some((es) => es.serviceId === s.id),
              ).length > 0 && (
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(serviceId) => {
                      const service = allServices.find(
                        (s) => s.id === serviceId,
                      )
                      if (service) handleAddService(service)
                    }}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Add a service..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allServices
                        .filter(
                          (s) =>
                            !editableServices.some(
                              (es) => es.serviceId === s.id,
                            ),
                        )
                        .map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="mt-4 flex justify-end text-lg font-semibold">
                Total: {calculateTotal().toFixed(2)} {quote.currency}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Revision Information</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {currentRevisions}/2 revisions for this quote family
                  </Badge>
                  {!canRevise && (
                    <Badge variant="destructive" className="text-xs">
                      Limit reached
                    </Badge>
                  )}
                </div>
              </CardTitle>
              {!canRevise && revisionUpgradeMessage && (
                <CardDescription className="text-red-600">
                  {revisionUpgradeMessage}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="revisionNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revision Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the changes or reason for revision..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientFeedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste or summarize client feedback here..."
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

          <Card>
            <CardHeader>
              <CardTitle>AI Re-analysis</CardTitle>
              <CardDescription>
                Get updated AI recommendations based on client feedback and
                revision context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                onClick={handleReanalyzeWithAI}
                disabled={isAnalyzing || editableServices.length === 0}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-analyze with AI
                  </>
                )}
              </Button>

              {aiAnalysis && showAIRecommendations && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">AI Revision Analysis</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyAIRecommendations}
                    >
                      Apply All Recommendations
                    </Button>
                  </div>

                  {/* Revision Strategy */}
                  {aiAnalysis.revisionStrategy && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Revision Strategy</h5>
                      <p className="text-muted-foreground text-sm">
                        {aiAnalysis.revisionStrategy}
                      </p>
                    </div>
                  )}

                  {/* Market Analysis */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Market Analysis</h5>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Location Factor:</strong>{' '}
                        {aiAnalysis.marketAnalysis.locationFactor}
                      </p>
                      <p>
                        <strong>Market Conditions:</strong>{' '}
                        {aiAnalysis.marketAnalysis.marketConditions}
                      </p>
                      <p>
                        <strong>Competitive Position:</strong>{' '}
                        {aiAnalysis.marketAnalysis.competitivePosition}
                      </p>
                      <p>
                        <strong>Revision Context:</strong>{' '}
                        {aiAnalysis.marketAnalysis.revisionContext}
                      </p>
                    </div>
                  </div>

                  {/* Service Recommendations */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">
                      Service Recommendations
                    </h5>
                    <div className="space-y-2">
                      {aiAnalysis.serviceRecommendations.map((rec, index) => (
                        <div key={index} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-medium">
                              {rec.serviceName}
                            </span>
                            <Badge
                              variant={
                                rec.confidenceLevel === 'high'
                                  ? 'default'
                                  : rec.confidenceLevel === 'medium'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {rec.confidenceLevel} confidence
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Current:
                              </span>
                              <span className="ml-2 font-medium">
                                ${rec.currentPrice}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Recommended:
                              </span>
                              <span className="ml-2 font-medium text-green-600">
                                ${rec.recommendedPrice}
                              </span>
                            </div>
                          </div>
                          <p className="text-muted-foreground mt-2 text-sm">
                            {rec.reasoning}
                          </p>
                          {rec.revisionImpact && (
                            <p className="text-muted-foreground mt-1 text-sm">
                              <strong>Revision Impact:</strong>{' '}
                              {rec.revisionImpact}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Negotiation Tips */}
                  {aiAnalysis.negotiationTips.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Negotiation Tips</h5>
                      <ul className="space-y-1 text-sm">
                        {aiAnalysis.negotiationTips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1 text-blue-500">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !canRevise}>
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Revised Quote
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

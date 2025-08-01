'use server'

import { revalidatePath } from 'next/cache'

import { and, eq, inArray } from 'drizzle-orm'

import db from '@/db'
import {
  companies,
  quoteServices,
  quoteVersions,
  quotes,
  services,
} from '@/db/schema'
import { getUser } from '@/lib/auth'
import { generateAIAssistedQuote } from '@/lib/gemini'
import {
  generateFinalQuoteWithAI,
  generateQuoteRevisionAnalysis,
  negotiatePriceWithAI,
} from '@/lib/gemini'
import {
  canCreateQuote,
  canCreateQuoteRevision,
  getCurrentMonthOriginalQuotes,
} from '@/lib/subscription'
import { calculateTax } from '@/lib/tax-utils'
import type { QuoteStatus } from '@/types'

export interface CreateQuoteData {
  userId: string
  companyId: string
  projectTitle: string
  projectDescription?: string
  clientName?: string
  clientEmail?: string
  clientLocation: string
  deliveryTimeline: string
  customTimeline?: string
  clientBudget?: number
  projectComplexity: string
  currency?: string
  // Tax fields
  taxEnabled?: boolean
  taxRate?: number
  selectedServices: Array<{
    serviceId: string
    quantity: number
    unitPrice?: number
    notes?: string
  }>
  quoteData?: {
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
  } // Rich quote document data from AI
}

export async function createQuoteAction(data: CreateQuoteData) {
  try {
    // Get user to check actual subscription tier
    const user = await getUser()
    if (!user || user.id !== data.userId) {
      return {
        success: false,
        error: 'Unauthorized to create quote',
      }
    }

    // Check subscription limit - only count original quotes, not revisions
    const currentOriginalQuotes = await getCurrentMonthOriginalQuotes(
      data.userId,
    )
    const canCreate = canCreateQuote(
      user.subscriptionTier,
      currentOriginalQuotes,
    )

    if (!canCreate) {
      return {
        success: false,
        error: 'Quote limit reached. Upgrade to Pro for unlimited quotes.',
      }
    }

    // Calculate subtotal from services
    const subtotal = data.selectedServices.reduce((sum, service) => {
      const quantity = service.quantity || 1
      const unitPrice = service.unitPrice || 0
      return sum + quantity * unitPrice
    }, 0)

    // Calculate tax if enabled
    const taxEnabled = data.taxEnabled || false
    const taxRate = data.taxRate || 0
    let taxAmount = 0
    let totalAmount = subtotal

    if (taxEnabled && taxRate > 0) {
      const taxCalc = calculateTax(subtotal, taxRate)
      taxAmount = taxCalc.taxAmount
      totalAmount = taxCalc.total
    }

    const [quote] = await db
      .insert(quotes)
      .values({
        userId: data.userId,
        companyId: data.companyId,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        amount: totalAmount > 0 ? totalAmount.toString() : undefined,
        subtotal: subtotal > 0 ? subtotal.toString() : undefined,
        taxEnabled,
        taxRate: taxEnabled && taxRate > 0 ? (taxRate / 100).toString() : '0',
        taxAmount: taxEnabled && taxAmount > 0 ? taxAmount.toString() : '0',
        currency: data.currency || 'USD',
        clientEmail: data.clientEmail,
        clientName: data.clientName,
        clientLocation: data.clientLocation,
        clientBudget: data.clientBudget?.toString(),
        deliveryTimeline: data.deliveryTimeline,
        customTimeline: data.customTimeline,
        projectComplexity: data.projectComplexity,
        quoteData: data.quoteData || null,
      } as typeof quotes.$inferInsert)
      .returning()

    // Insert quote services
    if (data.selectedServices.length > 0) {
      const quoteServiceData = data.selectedServices.map((service) => ({
        quoteId: quote.id,
        serviceId: service.serviceId,
        quantity: service.quantity.toString(),
        unitPrice: service.unitPrice?.toString(),
        totalPrice: service.unitPrice
          ? (service.quantity * service.unitPrice).toString()
          : undefined,
        notes: service.notes,
      }))

      await db.insert(quoteServices).values(quoteServiceData)
    }

    // Fetch the complete quote with company and service details
    const completeQuote = await getQuoteWithServicesAction(quote.id)

    revalidatePath('/dashboard')
    revalidatePath('/quotes')
    revalidatePath('/new-quote')

    return {
      success: true,
      quote: completeQuote.success ? completeQuote.quote : quote,
    }
  } catch (error) {
    console.error('Error creating quote:', error)
    return {
      success: false,
      error: 'Failed to create quote',
    }
  }
}

export async function getQuotesAction(userId: string) {
  try {
    // Fetch quotes with company details
    const quotesData = await db
      .select({
        id: quotes.id,
        userId: quotes.userId,
        companyId: quotes.companyId,
        projectTitle: quotes.projectTitle,
        projectDescription: quotes.projectDescription,
        amount: quotes.amount,
        currency: quotes.currency,
        status: quotes.status,
        clientEmail: quotes.clientEmail,
        clientName: quotes.clientName,
        clientLocation: quotes.clientLocation,
        clientBudget: quotes.clientBudget,
        deliveryTimeline: quotes.deliveryTimeline,
        customTimeline: quotes.customTimeline,
        projectComplexity: quotes.projectComplexity,
        quoteData: quotes.quoteData,
        sentAt: quotes.sentAt,
        parentQuoteId: quotes.parentQuoteId,
        revisionNotes: quotes.revisionNotes,
        clientFeedback: quotes.clientFeedback,
        versionNumber: quotes.versionNumber,
        // Tax fields
        subtotal: quotes.subtotal,
        taxEnabled: quotes.taxEnabled,
        taxRate: quotes.taxRate,
        taxAmount: quotes.taxAmount,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        company: {
          id: companies.id,
          name: companies.name,
          businessType: companies.businessType,
          country: companies.country,
          address: companies.address,
          phone: companies.phone,
          website: companies.website,
          logoUrl: companies.logoUrl,
        },
      })
      .from(quotes)
      .leftJoin(companies, eq(quotes.companyId, companies.id))
      .where(eq(quotes.userId, userId))
      .orderBy(quotes.createdAt)

    // Fetch quote services for each quote
    const quotesWithServices = await Promise.all(
      quotesData.map(async (quote) => {
        const quoteServicesData = await db
          .select({
            id: quoteServices.id,
            quoteId: quoteServices.quoteId,
            serviceId: quoteServices.serviceId,
            quantity: quoteServices.quantity,
            unitPrice: quoteServices.unitPrice,
            totalPrice: quoteServices.totalPrice,
            notes: quoteServices.notes,
            service: {
              id: services.id,
              name: services.name,
              description: services.description,
              skillLevel: services.skillLevel,
              basePrice: services.basePrice,
              currency: services.currency,
            },
          })
          .from(quoteServices)
          .leftJoin(services, eq(quoteServices.serviceId, services.id))
          .where(eq(quoteServices.quoteId, quote.id))

        return {
          ...quote,
          quoteServices: quoteServicesData,
        }
      }),
    )

    return {
      success: true,
      quotes: quotesWithServices,
    }
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return {
      success: false,
      error: 'Failed to fetch quotes',
    }
  }
}

export async function updateQuoteStatusAction(
  quoteId: string,
  status: QuoteStatus,
) {
  try {
    const [quote] = await db
      .update(quotes)
      .set({
        status,
        sentAt: status === 'awaiting_client' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId))
      .returning()

    revalidatePath('/dashboard')
    revalidatePath('/quotes')

    return {
      success: true,
      quote,
    }
  } catch (error) {
    console.error('Error updating quote status:', error)
    return {
      success: false,
      error: 'Failed to update quote status',
    }
  }
}

export async function getQuoteWithServicesAction(quoteId: string) {
  try {
    // Fetch quote with company details
    const [quoteData] = await db
      .select({
        id: quotes.id,
        userId: quotes.userId,
        companyId: quotes.companyId,
        projectTitle: quotes.projectTitle,
        projectDescription: quotes.projectDescription,
        amount: quotes.amount,
        currency: quotes.currency,
        status: quotes.status,
        clientEmail: quotes.clientEmail,
        clientName: quotes.clientName,
        clientLocation: quotes.clientLocation,
        clientBudget: quotes.clientBudget,
        deliveryTimeline: quotes.deliveryTimeline,
        customTimeline: quotes.customTimeline,
        projectComplexity: quotes.projectComplexity,
        quoteData: quotes.quoteData,
        sentAt: quotes.sentAt,
        // Revision fields for quote editing system
        parentQuoteId: quotes.parentQuoteId,
        revisionNotes: quotes.revisionNotes,
        clientFeedback: quotes.clientFeedback,
        versionNumber: quotes.versionNumber,
        // Tax fields
        subtotal: quotes.subtotal,
        taxEnabled: quotes.taxEnabled,
        taxRate: quotes.taxRate,
        taxAmount: quotes.taxAmount,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        company: {
          id: companies.id,
          name: companies.name,
          businessType: companies.businessType,
          country: companies.country,
          address: companies.address,
          phone: companies.phone,
          website: companies.website,
          logoUrl: companies.logoUrl,
        },
      })
      .from(quotes)
      .leftJoin(companies, eq(quotes.companyId, companies.id))
      .where(eq(quotes.id, quoteId))

    if (!quoteData) {
      return {
        success: false,
        error: 'Quote not found',
      }
    }

    // Fetch quote services with service details
    const quoteServicesData = await db
      .select({
        id: quoteServices.id,
        quoteId: quoteServices.quoteId,
        serviceId: quoteServices.serviceId,
        quantity: quoteServices.quantity,
        unitPrice: quoteServices.unitPrice,
        totalPrice: quoteServices.totalPrice,
        notes: quoteServices.notes,
        createdAt: quoteServices.createdAt,
        service: {
          id: services.id,
          name: services.name,
          description: services.description,
          skillLevel: services.skillLevel,
          basePrice: services.basePrice,
          currency: services.currency,
        },
      })
      .from(quoteServices)
      .leftJoin(services, eq(quoteServices.serviceId, services.id))
      .where(eq(quoteServices.quoteId, quoteId))

    return {
      success: true,
      quote: {
        ...quoteData,
        quoteServices: quoteServicesData,
      },
    }
  } catch (error) {
    console.error('Error fetching quote:', error)
    return {
      success: false,
      error: 'Failed to fetch quote',
    }
  }
}

export async function generateAIAssistedQuoteAction(data: {
  companyId: string
  projectTitle: string
  projectDescription?: string
  complexity: string
  deliveryTimeline: string
  customTimeline?: string
  clientLocation: string
  clientBudget?: number
  selectedServices: Array<{
    serviceId: string
    serviceName: string
    skillLevel: string
    basePrice?: string
    quantity: number
    currentPrice: number
  }>
}) {
  try {
    // Get company data with AI summary
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, data.companyId))

    if (!company) {
      return {
        success: false,
        error: 'Company not found',
      }
    }

    // Generate AI-assisted quote
    const aiResponse = await generateAIAssistedQuote({
      companyData: {
        name: company.name,
        description: company.description || '',
        businessType: company.businessType,
        country: company.country,
        currency: company.currency!,
        aiSummary: company.aiSummary || undefined,
        services: [], // We'll get services separately if needed
      },
      projectData: {
        title: data.projectTitle,
        description: data.projectDescription,
        complexity: data.complexity,
        deliveryTimeline: data.deliveryTimeline,
        customTimeline: data.customTimeline,
        clientLocation: data.clientLocation,
        clientBudget: data.clientBudget,
        selectedServices: data.selectedServices,
      },
    })

    return {
      success: true,
      aiResponse,
    }
  } catch (error) {
    console.error('Error generating AI quote:', error)
    return {
      success: false,
      error: 'Failed to generate AI quote',
    }
  }
}

export async function generateFinalQuoteAction(data: {
  companyId: string
  projectData: {
    title: string
    description?: string
    complexity: string
    deliveryTimeline: string
    customTimeline?: string
    clientLocation: string
    clientBudget?: number
  }
  finalData: {
    services: Array<{
      serviceName: string
      finalPrice: number
      quantity: number
      totalPrice: number
    }>
    totalAmount: number
    notes?: string
    // Tax fields
    subtotal?: number
    taxEnabled?: boolean
    taxRate?: number
    taxAmount?: number
  }
}) {
  try {
    // Get company data
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, data.companyId))

    if (!company) {
      return {
        success: false,
        error: 'Company not found',
      }
    }

    // Generate final quote document
    const aiResponse = await generateFinalQuoteWithAI({
      companyData: {
        name: company.name,
        description: company.description || '',
        businessType: company.businessType,
        country: company.country,
        currency: 'USD',
        aiSummary: company.aiSummary || undefined,
        phone: company.phone || '',
        email: company.email || '',
      },
      projectData: data.projectData,
      finalData: {
        ...data.finalData,
        notes: data.finalData.notes || '',
      },
    })

    return {
      success: true,
      aiResponse,
    }
  } catch (error) {
    console.error('Error generating final quote:', error)
    return {
      success: false,
      error: 'Failed to generate final quote',
    }
  }
}

export async function negotiatePriceAction(data: {
  serviceName: string
  proposedPrice: number
  reasoning: string
  companyId: string
  projectContext: string
}) {
  try {
    // Get company data
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, data.companyId))

    if (!company) {
      return {
        success: false,
        error: 'Company not found',
      }
    }

    // Generate negotiation response
    const aiResponse = await negotiatePriceWithAI({
      companyData: {
        name: company.name,
        description: company.description || '',
        businessType: company.businessType,
        country: company.country,
        currency: company.currency,
        aiSummary: company.aiSummary || undefined,
        services: [],
      },
      projectData: {
        title: data.projectContext,
        description: '',
        complexity: 'moderate',
        deliveryTimeline: '1_month',
        clientLocation: '',
      },
      negotiationData: {
        serviceName: data.serviceName,
        currentRecommendedPrice: data.proposedPrice,
        proposedPrice: data.proposedPrice,
        userReasoning: data.reasoning,
        priceRange: {
          min: data.proposedPrice * 0.8,
          max: data.proposedPrice * 1.2,
        },
      },
    })

    return {
      success: true,
      aiResponse,
    }
  } catch (error) {
    console.error('Error negotiating price:', error)
    return {
      success: false,
      error: 'Failed to negotiate price',
    }
  }
}

export async function deleteQuoteAction(quoteId: string, userId: string) {
  try {
    // First, verify the quote belongs to the user
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, quoteId),
    })

    if (!quote) {
      return {
        success: false,
        error: 'Quote not found',
      }
    }

    if (quote.userId !== userId) {
      return {
        success: false,
        error: 'Unauthorized to delete this quote',
      }
    }

    // Always delete the entire quote family to maintain conversation integrity
    const originalQuoteId = quote.parentQuoteId || quote.id

    // Get all quotes in this family
    const quoteFamily = await db.query.quotes.findMany({
      where: (quotes, { or, eq }) =>
        or(
          eq(quotes.id, originalQuoteId),
          eq(quotes.parentQuoteId, originalQuoteId),
        ),
    })

    const quotesToDelete = quoteFamily.map((q) => q.id)

    // Delete quote services first (due to foreign key constraints)
    await db
      .delete(quoteServices)
      .where(inArray(quoteServices.quoteId, quotesToDelete))

    // Delete the quotes
    await db.delete(quotes).where(inArray(quotes.id, quotesToDelete))

    revalidatePath('/dashboard')
    revalidatePath('/quotes')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting quote:', error)
    return {
      success: false,
      error: 'Failed to delete quote',
    }
  }
}

// Quote Editing System Actions

export async function getQuoteForEditingAction(
  quoteId: string,
  userId: string,
) {
  try {
    // Get the quote with all related data
    const quote = await getQuoteWithServicesAction(quoteId)

    if (!quote.success || !quote.quote) {
      return {
        success: false,
        error: 'Quote not found',
      }
    }

    // Verify the quote belongs to the user
    if (quote.quote.userId !== userId) {
      return {
        success: false,
        error: 'Unauthorized to edit this quote',
      }
    }

    return {
      success: true,
      quote: quote.quote,
    }
  } catch (error) {
    console.error('Error getting quote for editing:', error)
    return {
      success: false,
      error: 'Failed to get quote for editing',
    }
  }
}

export async function createRevisedQuoteAction(data: {
  originalQuoteId: string
  userId: string
  companyId: string
  projectTitle: string
  projectDescription?: string
  clientName?: string
  clientEmail?: string
  clientLocation: string
  deliveryTimeline: string
  customTimeline?: string
  clientBudget?: number
  projectComplexity: string
  currency?: string
  // Tax fields
  taxEnabled?: boolean
  taxRate?: number
  selectedServices: Array<{
    serviceId: string
    quantity: number
    unitPrice?: number
    notes?: string
  }>
  revisionNotes: string
  clientFeedback?: string
  quoteData?: CreateQuoteData['quoteData']
}) {
  try {
    // Get the original quote to determine the next version number
    const [originalQuote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, data.originalQuoteId))

    if (!originalQuote) {
      return {
        success: false,
        error: 'Original quote not found',
      }
    }

    // Verify the original quote belongs to the user
    if (originalQuote.userId !== data.userId) {
      return {
        success: false,
        error: 'Unauthorized to revise this quote',
      }
    }

    // Get user to check actual subscription tier
    const user = await getUser()
    if (!user || user.id !== data.userId) {
      return {
        success: false,
        error: 'Unauthorized to create revision',
      }
    }

    // Check revision limit
    const canRevise = await canCreateQuoteRevision(
      data.originalQuoteId,
      user.subscriptionTier,
    )
    if (!canRevise) {
      return {
        success: false,
        error:
          'Revision limit reached. Upgrade to Pro for unlimited revisions.',
      }
    }

    // Find the root quote (the original quote without a parent)
    const rootQuoteId = originalQuote.parentQuoteId || originalQuote.id

    // Calculate the next version number
    const nextVersionNumber = Number(originalQuote.versionNumber) + 1

    // Calculate subtotal from services
    const subtotal = data.selectedServices.reduce((sum, service) => {
      const quantity = service.quantity || 1
      const unitPrice = service.unitPrice || 0
      return sum + quantity * unitPrice
    }, 0)

    // Calculate tax if enabled
    const taxEnabled = data.taxEnabled || false
    const taxRate = data.taxRate || 0
    let taxAmount = 0
    let totalAmount = subtotal

    if (taxEnabled && taxRate > 0) {
      const taxCalc = calculateTax(subtotal, taxRate)
      taxAmount = taxCalc.taxAmount
      totalAmount = taxCalc.total
    }

    // Get company details for AI generation
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, data.companyId))

    if (!company) {
      return {
        success: false,
        error: 'Company not found',
      }
    }

    // Get service details for AI generation
    const serviceDetails = await db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
      })
      .from(services)
      .where(
        inArray(
          services.id,
          data.selectedServices.map((s) => s.serviceId),
        ),
      )

    // Generate fresh AI quote document for the revision
    let updatedQuoteData = null
    try {
      const aiResponse = await generateFinalQuoteWithAI({
        companyData: {
          name: company.name,
          description: company.description || '',
          businessType: company.businessType,
          country: company.country,
          currency: data.currency || 'USD',
          aiSummary: company.aiSummary || undefined,
          phone: company.phone || '',
          email: company.email || '',
        },
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
          services: data.selectedServices.map((service) => {
            const serviceDetail = serviceDetails.find(
              (s) => s.id === service.serviceId,
            )
            return {
              serviceName:
                serviceDetail?.name || `Service ${service.serviceId}`,
              finalPrice: service.unitPrice || 0,
              quantity: service.quantity,
              totalPrice: service.quantity * (service.unitPrice || 0),
            }
          }),
          totalAmount,
          notes: `Revision ${nextVersionNumber}: ${data.revisionNotes}${data.clientFeedback ? ` | Client Feedback: ${data.clientFeedback}` : ''}`,
          // Include tax data for AI response
          subtotal,
          taxEnabled,
          taxRate: taxEnabled && taxRate > 0 ? taxRate / 100 : 0, // Convert to decimal for AI
          taxAmount,
        },
      })

      updatedQuoteData = aiResponse
    } catch (error) {
      console.error('Error generating AI quote for revision:', error)
      // Fallback: Update existing quoteData with new prices if AI generation fails
      if (data.quoteData && data.quoteData.quoteDocument) {
        updatedQuoteData = {
          ...data.quoteData,
          quoteDocument: {
            ...data.quoteData.quoteDocument,
            serviceBreakdown: data.selectedServices.map((service) => {
              const serviceDetail = serviceDetails.find(
                (s) => s.id === service.serviceId,
              )
              const originalService =
                data.quoteData!.quoteDocument.serviceBreakdown.find(
                  (s) => s.serviceName === serviceDetail?.name,
                )

              return {
                serviceName:
                  serviceDetail?.name || `Service ${service.serviceId}`,
                description:
                  originalService?.description ||
                  serviceDetail?.description ||
                  '',
                quantity: service.quantity,
                unitPrice: service.unitPrice || 0,
                totalPrice: service.quantity * (service.unitPrice || 0),
                deliverables: originalService?.deliverables || [],
              }
            }),
          },
          // Add pricing section for fallback
          pricing: {
            subtotal,
            taxEnabled,
            taxRate: taxEnabled && taxRate > 0 ? taxRate / 100 : 0,
            taxAmount,
            totalAmount,
            currency: data.currency || 'USD',
          },
        }
      }
    }

    // Create the revised quote
    const [revisedQuote] = await db
      .insert(quotes)
      .values({
        userId: data.userId,
        companyId: data.companyId,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientLocation: data.clientLocation,
        clientBudget: data.clientBudget?.toString(),
        currency: data.currency,
        amount: totalAmount > 0 ? totalAmount.toString() : undefined,
        subtotal: subtotal > 0 ? subtotal.toString() : undefined,
        taxEnabled,
        taxRate: taxEnabled && taxRate > 0 ? (taxRate / 100).toString() : '0',
        taxAmount: taxEnabled && taxAmount > 0 ? taxAmount.toString() : '0',
        status: 'revised',
        parentQuoteId: rootQuoteId, // Always point to the root quote
        revisionNotes: data.revisionNotes,
        clientFeedback: data.clientFeedback,
        versionNumber: nextVersionNumber.toString(),
        deliveryTimeline: data.deliveryTimeline,
        customTimeline: data.customTimeline,
        projectComplexity: data.projectComplexity,
        quoteData: updatedQuoteData || null,
      } as typeof quotes.$inferInsert)
      .returning()

    // Insert quote services
    if (data.selectedServices.length > 0) {
      const quoteServiceData = data.selectedServices.map((service) => ({
        quoteId: revisedQuote.id,
        serviceId: service.serviceId,
        quantity: service.quantity.toString(),
        unitPrice: service.unitPrice?.toString(),
        totalPrice: service.unitPrice
          ? (service.quantity * service.unitPrice).toString()
          : undefined,
        notes: service.notes,
      }))

      await db.insert(quoteServices).values(quoteServiceData)
    }

    // Create a version record
    await db.insert(quoteVersions).values({
      originalQuoteId: rootQuoteId, // Always point to the root quote
      versionNumber: nextVersionNumber.toString(),
      revisionNotes: data.revisionNotes,
      clientFeedback: data.clientFeedback,
    })

    // Update the original quote status to 'rejected' since it's been revised
    await db
      .update(quotes)
      .set({ status: 'rejected' })
      .where(eq(quotes.id, data.originalQuoteId))

    // Fetch the complete revised quote
    const completeQuote = await getQuoteWithServicesAction(revisedQuote.id)

    revalidatePath('/dashboard')
    revalidatePath('/quotes')
    revalidatePath(`/quotes/${revisedQuote.id}`)

    return {
      success: true,
      quote: completeQuote.success ? completeQuote.quote : revisedQuote,
    }
  } catch (error) {
    console.error('Error creating revised quote:', error)
    return {
      success: false,
      error: 'Failed to create revised quote',
    }
  }
}

export async function getQuoteVersionHistoryAction(
  quoteId: string,
  userId: string,
) {
  try {
    // Verify the quote belongs to the user
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId))

    if (!quote) {
      return {
        success: false,
        error: 'Quote not found',
      }
    }

    if (quote.userId !== userId) {
      return {
        success: false,
        error: 'Unauthorized to view this quote history',
      }
    }

    // Determine if this is the original quote or a revision
    let originalQuoteId = quoteId
    if (quote.parentQuoteId) {
      // This is a revision, so get the original quote ID
      originalQuoteId = quote.parentQuoteId
    }

    // Get the original quote
    const [originalQuote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, originalQuoteId))

    if (!originalQuote) {
      return {
        success: false,
        error: 'Original quote not found',
      }
    }

    // Get all revisions of the original quote
    const revisions = await db
      .select()
      .from(quotes)
      .where(eq(quotes.parentQuoteId, originalQuoteId))
      .orderBy(quotes.createdAt)

    // Get version history records
    const versionHistory = await db
      .select()
      .from(quoteVersions)
      .where(eq(quoteVersions.originalQuoteId, originalQuoteId))
      .orderBy(quoteVersions.versionNumber)

    // Fetch quote services for all versions
    const allVersions = [originalQuote, ...revisions]
    const versionsWithServices = await Promise.all(
      allVersions.map(async (version) => {
        const quoteServicesData = await db
          .select({
            id: quoteServices.id,
            quoteId: quoteServices.quoteId,
            serviceId: quoteServices.serviceId,
            quantity: quoteServices.quantity,
            unitPrice: quoteServices.unitPrice,
            totalPrice: quoteServices.totalPrice,
            notes: quoteServices.notes,
            service: {
              id: services.id,
              name: services.name,
              description: services.description,
              skillLevel: services.skillLevel,
              basePrice: services.basePrice,
              currency: services.currency,
            },
          })
          .from(quoteServices)
          .leftJoin(services, eq(quoteServices.serviceId, services.id))
          .where(eq(quoteServices.quoteId, version.id))

        return {
          ...version,
          quoteServices: quoteServicesData,
        }
      }),
    )

    return {
      success: true,
      versions: versionsWithServices,
      versionHistory,
    }
  } catch (error) {
    console.error('Error getting quote version history:', error)
    return {
      success: false,
      error: 'Failed to get quote version history',
    }
  }
}

export async function compareQuotesAction(
  quoteId1: string,
  quoteId2: string,
  userId: string,
) {
  try {
    // Get both quotes
    const quote1 = await getQuoteWithServicesAction(quoteId1)
    const quote2 = await getQuoteWithServicesAction(quoteId2)

    if (!quote1.success || !quote2.success) {
      return {
        success: false,
        error: 'One or both quotes not found',
      }
    }

    // Verify both quotes belong to the user
    if (quote1.quote!.userId !== userId || quote2.quote!.userId !== userId) {
      return {
        success: false,
        error: 'Unauthorized to compare these quotes',
      }
    }

    return {
      success: true,
      quote1: quote1.quote,
      quote2: quote2.quote,
    }
  } catch (error) {
    console.error('Error comparing quotes:', error)
    return {
      success: false,
      error: 'Failed to compare quotes',
    }
  }
}

export async function generateQuoteRevisionAnalysisAction(data: {
  companyId: string
  projectTitle: string
  projectDescription?: string
  complexity: string
  deliveryTimeline: string
  customTimeline?: string
  clientLocation: string
  clientBudget?: number
  clientFeedback: string
  revisionNotes: string
  currentServices: Array<{
    serviceId: string
    serviceName: string
    skillLevel: string
    quantity: number
    currentPrice: number
  }>
  previousQuoteData: {
    amount: string
    services: Array<{
      serviceName: string
      quantity: number
      unitPrice: number
      totalPrice: number
    }>
    status: string
    versionNumber?: number
  }
}) {
  try {
    // Get company data
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, data.companyId))

    if (!company) {
      return {
        success: false,
        error: 'Company not found',
      }
    }

    // Generate quote revision analysis
    const aiResponse = await generateQuoteRevisionAnalysis({
      companyData: {
        name: company.name,
        description: company.description || '',
        businessType: company.businessType,
        country: company.country,
        currency: 'USD',
        aiSummary: company.aiSummary || undefined,
      },
      projectData: {
        title: data.projectTitle,
        description: data.projectDescription,
        complexity: data.complexity,
        deliveryTimeline: data.deliveryTimeline,
        customTimeline: data.customTimeline,
        clientLocation: data.clientLocation,
        clientBudget: data.clientBudget,
      },
      revisionContext: {
        clientFeedback: data.clientFeedback,
        revisionNotes: data.revisionNotes,
        previousQuoteData: data.previousQuoteData,
        currentServices: data.currentServices,
      },
    })

    return {
      success: true,
      aiResponse,
    }
  } catch (error) {
    console.error('Error generating quote revision analysis:', error)
    return {
      success: false,
      error: 'Failed to generate quote revision analysis',
    }
  }
}

export async function getQuoteRevisionHistoryForConversationAction(
  quoteId: string,
  userId: string,
) {
  try {
    // Get the quote to determine if it's a revision
    const quote = await db.query.quotes.findFirst({
      where: (quotes, { eq }) => eq(quotes.id, quoteId),
    })

    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }

    // Get the original quote ID for threading
    const originalQuoteId = quote.parentQuoteId || quote.id

    // Get all quotes in this family (original + revisions)
    const quoteFamily = await db.query.quotes.findMany({
      where: (quotes, { or, eq }) =>
        or(
          eq(quotes.id, originalQuoteId),
          eq(quotes.parentQuoteId, originalQuoteId),
        ),
      orderBy: (quotes, { asc }) => [asc(quotes.createdAt)],
    })

    // Get email threads for each quote in the family
    const revisionHistory = await Promise.all(
      quoteFamily.map(async (quoteVersion) => {
        const emailThread = await db.query.emailThreads.findFirst({
          where: (emailThreads, { eq, and }) =>
            and(
              eq(emailThreads.quoteId, quoteVersion.id),
              eq(emailThreads.userId, userId),
              eq(emailThreads.direction, 'outbound'),
            ),
          orderBy: (emailThreads, { desc }) => [desc(emailThreads.sentAt)],
        })

        return {
          id: quoteVersion.id,
          versionNumber: quoteVersion.versionNumber || '1',
          revisionNotes: quoteVersion.revisionNotes,
          sentAt: emailThread?.sentAt || quoteVersion.createdAt,
          subject:
            emailThread?.subject || `Quote - ${quoteVersion.projectTitle}`,
          isRevision: quoteVersion.parentQuoteId !== null,
          hasEmail: !!emailThread,
        }
      }),
    )

    // Filter out quotes that haven't been sent yet
    const sentRevisions = revisionHistory.filter(
      (revision) => revision.hasEmail,
    )

    return {
      success: true,
      revisions: sentRevisions,
      originalQuoteId,
    }
  } catch (error) {
    console.error('Error fetching quote revision history:', error)
    return {
      success: false,
      error: 'Failed to fetch quote revision history',
    }
  }
}

export async function getLatestQuotesAction(
  userId: string,
  companyId?: string,
) {
  try {
    // Build where conditions
    const whereConditions = [eq(quotes.userId, userId)]
    if (companyId) {
      whereConditions.push(eq(quotes.companyId, companyId))
    }

    // First, get all quotes for the user (optionally filtered by company)
    const allQuotes = await db
      .select({
        id: quotes.id,
        userId: quotes.userId,
        companyId: quotes.companyId,
        projectTitle: quotes.projectTitle,
        projectDescription: quotes.projectDescription,
        amount: quotes.amount,
        currency: quotes.currency,
        status: quotes.status,
        clientEmail: quotes.clientEmail,
        clientName: quotes.clientName,
        quoteData: quotes.quoteData,
        sentAt: quotes.sentAt,
        parentQuoteId: quotes.parentQuoteId,
        revisionNotes: quotes.revisionNotes,
        clientFeedback: quotes.clientFeedback,
        versionNumber: quotes.versionNumber,
        // Tax fields
        subtotal: quotes.subtotal,
        taxEnabled: quotes.taxEnabled,
        taxRate: quotes.taxRate,
        taxAmount: quotes.taxAmount,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        company: {
          id: companies.id,
          name: companies.name,
          businessType: companies.businessType,
          country: companies.country,
          address: companies.address,
          phone: companies.phone,
          website: companies.website,
          logoUrl: companies.logoUrl,
        },
      })
      .from(quotes)
      .leftJoin(companies, eq(quotes.companyId, companies.id))
      .where(
        whereConditions.length === 1
          ? whereConditions[0]
          : and(...whereConditions),
      )
      .orderBy(quotes.createdAt)

    // Group quotes by their quote family (original quote or revision chain)
    const quoteFamilies = new Map<string, typeof allQuotes>()

    allQuotes.forEach((quote) => {
      // For original quotes (no parentQuoteId), use the quote ID as the family key
      // For revisions, use the parentQuoteId as the family key
      const familyKey = quote.parentQuoteId || quote.id

      if (!quoteFamilies.has(familyKey)) {
        quoteFamilies.set(familyKey, [])
      }
      quoteFamilies.get(familyKey)!.push(quote)
    })

    // For each family, get the latest version with smart rejected quote logic
    const latestQuotes = Array.from(quoteFamilies.values())
      .map((family) => {
        // Sort by version number first (convert to number, handle '1' vs '2' etc.)
        const sorted = family.sort((a, b) => {
          const versionA = parseInt(a.versionNumber || '1')
          const versionB = parseInt(b.versionNumber || '1')
          return versionB - versionA // Latest first
        })

        // Check if there are any non-rejected quotes in the family
        const nonRejectedQuotes = family.filter(
          (quote) => quote.status !== 'rejected',
        )

        // If there are non-rejected quotes, return the latest non-rejected one
        if (nonRejectedQuotes.length > 0) {
          const sortedNonRejected = nonRejectedQuotes.sort((a, b) => {
            const versionA = parseInt(a.versionNumber || '1')
            const versionB = parseInt(b.versionNumber || '1')
            return versionB - versionA // Latest first
          })
          return sortedNonRejected[0]
        }

        // If ALL quotes in the family are rejected, check if this is a standalone rejection
        // or a family with multiple versions (superseded rejections)
        if (family.length === 1) {
          // This is a standalone rejected quote (original quote with no revisions)
          // Show it since it's the only version and represents the final state
          return sorted[0]
        } else {
          // This is a family with multiple versions where all are rejected
          // This typically means the original was rejected and revisions were also rejected
          // In this case, show the latest rejected version
          return sorted[0]
        }
      })
      .filter((quote): quote is (typeof allQuotes)[0] => quote !== null) // Remove null entries and type properly

    // Fetch quote services for each latest quote
    const latestQuotesWithServices = await Promise.all(
      latestQuotes.map(async (quote) => {
        const quoteServicesData = await db
          .select({
            id: quoteServices.id,
            quoteId: quoteServices.quoteId,
            serviceId: quoteServices.serviceId,
            quantity: quoteServices.quantity,
            unitPrice: quoteServices.unitPrice,
            totalPrice: quoteServices.totalPrice,
            notes: quoteServices.notes,
            service: {
              id: services.id,
              name: services.name,
              description: services.description,
              skillLevel: services.skillLevel,
              basePrice: services.basePrice,
              currency: services.currency,
            },
          })
          .from(quoteServices)
          .leftJoin(services, eq(quoteServices.serviceId, services.id))
          .where(eq(quoteServices.quoteId, quote.id))

        return {
          ...quote,
          quoteServices: quoteServicesData,
        }
      }),
    )

    return {
      success: true,
      quotes: latestQuotesWithServices,
    }
  } catch (error) {
    console.error('Error fetching latest quotes:', error)
    return {
      success: false,
      error: 'Failed to fetch latest quotes',
    }
  }
}

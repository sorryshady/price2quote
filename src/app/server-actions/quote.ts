'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { companies, quoteServices, quotes, services } from '@/db/schema'
import { generateAIAssistedQuote } from '@/lib/gemini'
import { generateFinalQuoteWithAI, negotiatePriceWithAI } from '@/lib/gemini'
import { canUserCreateQuote } from '@/lib/subscription'
import type { QuoteStatus } from '@/types'

interface CreateQuoteData {
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
    // Check subscription limit
    const canCreate = await canUserCreateQuote(data.userId, 'free') // TODO: Get actual user tier

    if (!canCreate) {
      return {
        success: false,
        error: 'Quote limit reached. Upgrade to Pro for unlimited quotes.',
      }
    }

    // Calculate total amount from services
    const totalAmount = data.selectedServices.reduce((sum, service) => {
      const quantity = service.quantity || 1
      const unitPrice = service.unitPrice || 0
      return sum + quantity * unitPrice
    }, 0)

    const [quote] = await db
      .insert(quotes)
      .values({
        userId: data.userId,
        companyId: data.companyId,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        amount: totalAmount > 0 ? totalAmount.toString() : undefined,
        currency: data.currency || 'USD',
        clientEmail: data.clientEmail,
        clientName: data.clientName,
      })
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

    revalidatePath('/dashboard')
    revalidatePath('/quotes')
    revalidatePath('/new-quote')

    return {
      success: true,
      quote,
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
        sentAt: quotes.sentAt,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        company: {
          id: companies.id,
          name: companies.name,
          businessType: companies.businessType,
          country: companies.country,
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
        sentAt: status === 'sent' ? new Date() : undefined,
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
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId))

    if (!quote) {
      return {
        success: false,
        error: 'Quote not found',
      }
    }

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
      })
      .from(quoteServices)
      .where(eq(quoteServices.quoteId, quoteId))

    return {
      success: true,
      quote: {
        ...quote,
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
        currency: 'USD',
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
        currency: 'USD',
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

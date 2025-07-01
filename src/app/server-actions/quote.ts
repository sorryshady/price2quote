'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { quoteServices, quotes } from '@/db/schema'
import { canUserCreateQuote } from '@/lib/subscription'
import type { QuoteStatus } from '@/types'

interface CreateQuoteData {
  userId: string
  companyId: string
  projectTitle: string
  projectDescription?: string
  amount?: number
  currency?: string
  clientEmail?: string
  clientName?: string
  selectedServices: Array<{
    serviceId: string
    quantity: number
    unitPrice?: number
    notes?: string
  }>
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
        amount:
          totalAmount > 0 ? totalAmount.toString() : data.amount?.toString(),
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

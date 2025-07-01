'use server'

import { revalidatePath } from 'next/cache'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { quotes } from '@/db/schema'
import { canUserCreateQuote } from '@/lib/subscription'

interface CreateQuoteData {
  userId: string
  companyId: string
  title: string
  description?: string
  amount?: number
  currency?: string
  clientEmail?: string
  clientName?: string
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

    const [quote] = await db
      .insert(quotes)
      .values({
        userId: data.userId,
        companyId: data.companyId,
        title: data.title,
        description: data.description,
        amount: data.amount ? data.amount.toString() : null,
        currency: data.currency || 'USD',
        clientEmail: data.clientEmail,
        clientName: data.clientName,
      })
      .returning()

    revalidatePath('/dashboard')
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
  status: 'draft' | 'sent' | 'accepted' | 'rejected',
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

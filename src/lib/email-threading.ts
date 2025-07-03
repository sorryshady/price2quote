import { and, eq, inArray } from 'drizzle-orm'

import db from '@/db'
import { emailThreads } from '@/db/schema'

/**
 * Get the original quote ID for conversation threading
 * If the quote is a revision, returns the parent quote ID
 * If the quote is original, returns the quote ID itself
 */
export function getOriginalQuoteIdForThreading(quote: {
  id: string
  parentQuoteId?: string | null
}): string {
  return quote.parentQuoteId || quote.id
}

/**
 * Find existing email thread for a quote family (original + revisions)
 * Uses the original quote ID to maintain conversation continuity
 */
export async function findExistingEmailThread(
  userId: string,
  quoteId: string,
  to: string,
): Promise<{
  threadId: string | null
  lastSentAt: Date | null
  threadCount: number
}> {
  // First, get the quote to determine if it's a revision
  const quote = await db.query.quotes.findFirst({
    where: (quotes, { eq }) => eq(quotes.id, quoteId),
  })

  if (!quote) {
    return { threadId: null, lastSentAt: null, threadCount: 0 }
  }

  // Get the original quote ID for threading
  const originalQuoteId = getOriginalQuoteIdForThreading(quote)

  // Get all quotes in this family (original + revisions)
  const quoteFamily = await db.query.quotes.findMany({
    where: (quotes, { or, eq }) =>
      or(
        eq(quotes.id, originalQuoteId),
        eq(quotes.parentQuoteId, originalQuoteId),
      ),
  })

  const quoteIds = quoteFamily.map((q) => q.id)

  // Find the most recent email sent for any quote in this family
  const mostRecentEmail = await db.query.emailThreads.findFirst({
    where: (emailThreads, { eq, and, inArray }) =>
      and(
        inArray(emailThreads.quoteId, quoteIds),
        eq(emailThreads.userId, userId),
        eq(emailThreads.to, to),
      ),
    orderBy: (emailThreads, { desc }) => [desc(emailThreads.sentAt)],
  })

  if (!mostRecentEmail) {
    return { threadId: null, lastSentAt: null, threadCount: 0 }
  }

  // Count total emails in this thread (all quotes in family)
  const threadCountResult = await db
    .select()
    .from(emailThreads)
    .where(
      and(
        inArray(emailThreads.quoteId, quoteIds),
        eq(emailThreads.userId, userId),
        eq(emailThreads.to, to),
      ),
    )

  const threadCount = threadCountResult.length

  return {
    threadId: mostRecentEmail.gmailThreadId,
    lastSentAt: mostRecentEmail.sentAt,
    threadCount,
  }
}

/**
 * Save email thread with revision context
 */
export async function saveEmailThreadWithRevisionContext(data: {
  userId: string
  companyId: string
  quoteId: string
  originalQuoteId: string
  gmailMessageId: string
  gmailThreadId: string
  to: string
  cc?: string
  bcc?: string
  subject: string
  body: string
  attachments?: string
  includeQuotePdf: boolean
  revisionContext?: {
    versionNumber?: string
    revisionNotes?: string
    isRevision: boolean
  }
}) {
  const { revisionContext, ...threadData } = data

  // Add revision metadata to the body or store separately
  let enhancedBody = threadData.body
  if (revisionContext?.isRevision) {
    const revisionInfo = `\n\n---\nRevision Context:\nVersion: ${revisionContext.versionNumber}\nNotes: ${revisionContext.revisionNotes || 'No specific notes'}\nOriginal Quote ID: ${data.originalQuoteId}`
    enhancedBody += revisionInfo
  }

  return db.insert(emailThreads).values({
    ...threadData,
    body: enhancedBody,
    // Store revision metadata in emailType field
    emailType: revisionContext?.isRevision
      ? 'quote_revision_sent'
      : 'quote_sent',
  })
}

/**
 * Get conversation history for a quote family
 */
export async function getConversationHistory(
  userId: string,
  quoteId: string,
): Promise<
  Array<{
    id: string
    quoteId: string
    originalQuoteId: string
    subject: string
    body: string
    sentAt: Date
    direction: string
    revisionContext?: {
      versionNumber?: string
      isRevision: boolean
    }
  }>
> {
  // Get the quote to determine original quote ID
  const quote = await db.query.quotes.findFirst({
    where: (quotes, { eq }) => eq(quotes.id, quoteId),
  })

  if (!quote) {
    return []
  }

  const originalQuoteId = getOriginalQuoteIdForThreading(quote)

  // Get all quotes in this family (original + revisions)
  const quoteFamily = await db.query.quotes.findMany({
    where: (quotes, { or, eq }) =>
      or(
        eq(quotes.id, originalQuoteId),
        eq(quotes.parentQuoteId, originalQuoteId),
      ),
  })

  const quoteIds = quoteFamily.map((q) => q.id)

  // Get all emails in the conversation thread (all quotes in family)
  const emails = await db.query.emailThreads.findMany({
    where: (emailThreads, { eq, and, inArray }) =>
      and(
        inArray(emailThreads.quoteId, quoteIds),
        eq(emailThreads.userId, userId),
      ),
    orderBy: (emailThreads, { asc }) => [asc(emailThreads.sentAt)],
  })

  return emails.map((email) => ({
    id: email.id,
    quoteId: email.quoteId,
    originalQuoteId,
    subject: email.subject,
    body: email.body,
    sentAt: email.sentAt,
    direction: email.direction,
    revisionContext: {
      versionNumber:
        email.emailType === 'quote_revision_sent' ? 'revision' : 'original',
      isRevision: email.emailType === 'quote_revision_sent',
    },
  }))
}

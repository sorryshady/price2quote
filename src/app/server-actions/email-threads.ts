'use server'

import { and, eq } from 'drizzle-orm'

import db from '@/db'
import { emailThreads } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { findExistingEmailThread } from '@/lib/email-threading'

export interface EmailThread {
  id: string
  quoteId: string
  companyId: string
  gmailMessageId: string
  gmailThreadId: string | null
  direction: 'inbound' | 'outbound'
  fromEmail?: string
  to: string
  cc: string | null
  bcc: string | null
  subject: string
  body: string
  attachments: string[] | null
  includeQuotePdf: boolean | null
  isRead: boolean
  gmailLabels?: string[] | null
  emailType?: string | null
  sentAt: Date
  createdAt: Date
}

export interface ConversationGroup {
  conversationId: string
  quoteId: string
  clientEmail: string
  clientName: string | null
  projectTitle: string | null
  quoteStatus: string | null
  totalEmails: number
  lastEmailAt: Date
  emails: EmailThread[]
}

export async function getEmailThreadsAction(quoteId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get the quote to determine original quote ID for threading
    const quote = await db.query.quotes.findFirst({
      where: (quotes, { eq }) => eq(quotes.id, quoteId),
    })

    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }

    // Use original quote ID for threading (parentQuoteId or quoteId)
    const originalQuoteId = quote.parentQuoteId || quote.id

    const threads = await db.query.emailThreads.findMany({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.quoteId, originalQuoteId),
          eq(emailThreads.userId, session.user.id),
        ),
      orderBy: (emailThreads, { desc }) => [desc(emailThreads.sentAt)],
    })

    // Parse attachments JSON and gmail labels
    const parsedThreads: EmailThread[] = threads.map((thread) => ({
      ...thread,
      direction: thread.direction as 'inbound' | 'outbound',
      fromEmail: thread.fromEmail || undefined,
      attachments: thread.attachments ? JSON.parse(thread.attachments) : null,
      gmailLabels: thread.gmailLabels ? JSON.parse(thread.gmailLabels) : null,
      isRead: thread.isRead ?? false,
    }))

    return { success: true, threads: parsedThreads }
  } catch (error) {
    console.error('Error fetching email threads:', error)
    return { success: false, error: 'Failed to fetch email threads' }
  }
}

export async function getEmailThreadsByCompanyAction(companyId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get all email threads for the company
    const threads = await db.query.emailThreads.findMany({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.companyId, companyId),
          eq(emailThreads.userId, session.user.id),
        ),
      orderBy: (emailThreads, { desc }) => [desc(emailThreads.sentAt)],
    })

    // Get unique quote IDs to fetch quote data
    const quoteIds = [...new Set(threads.map((thread) => thread.quoteId))]

    // Fetch quote data for all threads
    const quotes = await db.query.quotes.findMany({
      where: (quotes, { inArray }) => inArray(quotes.id, quoteIds),
      columns: {
        id: true,
        projectTitle: true,
        clientName: true,
        clientEmail: true,
        status: true,
      },
    })

    // Create a map of quote data
    const quoteMap = new Map(quotes.map((quote) => [quote.id, quote]))

    // Parse attachments JSON and add quote data
    const parsedThreads = threads.map((thread) => ({
      ...thread,
      direction: thread.direction as 'inbound' | 'outbound',
      fromEmail: thread.fromEmail || undefined,
      quote: quoteMap.get(thread.quoteId) || undefined,
      attachments: thread.attachments ? JSON.parse(thread.attachments) : null,
      gmailLabels: thread.gmailLabels ? JSON.parse(thread.gmailLabels) : null,
      isRead: thread.isRead ?? false,
    }))

    // Group threads into conversations
    const conversations = groupThreadsIntoConversations(parsedThreads)

    return { success: true, conversations }
  } catch (error) {
    console.error('Error fetching email threads by company:', error)
    return { success: false, error: 'Failed to fetch email threads' }
  }
}

// Group email threads into conversations
function groupThreadsIntoConversations(
  threads: Array<
    EmailThread & {
      quote?: {
        clientName?: string | null
        projectTitle?: string | null
        status?: string | null
      }
    }
  >,
): ConversationGroup[] {
  const conversationMap = new Map<string, ConversationGroup>()

  for (const thread of threads) {
    // Use gmailThreadId as the conversation key
    const conversationId = thread.gmailThreadId || thread.id

    if (!conversationMap.has(conversationId)) {
      conversationMap.set(conversationId, {
        conversationId,
        quoteId: thread.quoteId,
        clientEmail: thread.to,
        clientName: thread.quote?.clientName || null,
        projectTitle: thread.quote?.projectTitle || null,
        quoteStatus: thread.quote?.status || null,
        totalEmails: 0,
        lastEmailAt: thread.sentAt,
        emails: [],
      })
    }

    const conversation = conversationMap.get(conversationId)!
    conversation.emails.push(thread)
    conversation.totalEmails += 1

    // Update last email date
    if (thread.sentAt > conversation.lastEmailAt) {
      conversation.lastEmailAt = thread.sentAt
    }
  }

  // Sort conversations by last email date (newest first)
  return Array.from(conversationMap.values()).sort(
    (a, b) => b.lastEmailAt.getTime() - a.lastEmailAt.getTime(),
  )
}

export async function getConversationEmailsAction(conversationId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // conversationId is now gmailThreadId
    const gmailThreadId = conversationId

    // Get all emails for this thread
    const threads = await db.query.emailThreads.findMany({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.gmailThreadId, gmailThreadId),
          eq(emailThreads.userId, session.user.id),
        ),
      orderBy: (emailThreads, { asc }) => [asc(emailThreads.sentAt)],
    })

    // Parse attachments JSON and attach quote info
    // Fetch quote for this thread (if any)
    let quote = undefined
    if (threads.length > 0 && threads[0].quoteId) {
      quote = await db.query.quotes.findFirst({
        where: (quotes, { eq }) => eq(quotes.id, threads[0].quoteId),
        columns: {
          projectTitle: true,
          clientName: true,
        },
      })
    }
    const parsedThreads: (EmailThread & {
      projectTitle?: string
      clientName?: string
    })[] = threads.map((thread) => ({
      ...thread,
      direction: thread.direction as 'inbound' | 'outbound',
      fromEmail: thread.fromEmail || undefined,
      attachments: thread.attachments ? JSON.parse(thread.attachments) : null,
      gmailLabels: thread.gmailLabels ? JSON.parse(thread.gmailLabels) : null,
      isRead: thread.isRead ?? false,
      projectTitle: quote?.projectTitle || undefined,
      clientName: quote?.clientName || undefined,
    }))

    return { success: true, emails: parsedThreads }
  } catch (error) {
    console.error('Error fetching conversation emails:', error)
    return { success: false, error: 'Failed to fetch conversation emails' }
  }
}

export async function deleteEmailThreadAction(threadId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify user owns this thread
    const thread = await db.query.emailThreads.findFirst({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.id, threadId),
          eq(emailThreads.userId, session.user.id),
        ),
    })

    if (!thread) {
      return { success: false, error: 'Thread not found' }
    }

    await db.delete(emailThreads).where(eq(emailThreads.id, threadId))

    return { success: true }
  } catch (error) {
    console.error('Error deleting email thread:', error)
    return { success: false, error: 'Failed to delete email thread' }
  }
}

export async function deleteConversationAction(conversationId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // conversationId is now gmailThreadId
    const gmailThreadId = conversationId

    // Delete all emails in this conversation thread
    await db
      .delete(emailThreads)
      .where(
        and(
          eq(emailThreads.gmailThreadId, gmailThreadId),
          eq(emailThreads.userId, session.user.id),
        ),
      )

    return { success: true }
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return { success: false, error: 'Failed to delete conversation' }
  }
}

export async function getExistingThreadForQuoteAction(
  quoteId: string,
  clientEmail: string,
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Use the new threading logic that considers quote families
    const { threadId, lastSentAt, threadCount } = await findExistingEmailThread(
      session.user.id,
      quoteId,
      clientEmail,
    )

    return {
      success: true,
      hasExistingThread: !!threadId,
      threadCount,
      lastSentAt,
    }
  } catch (error) {
    console.error('Error checking existing thread:', error)
    return { success: false, error: 'Failed to check existing thread' }
  }
}

export async function getConversationIdForQuoteAction(quoteId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get the quote to determine original quote ID for threading
    const quote = await db.query.quotes.findFirst({
      where: (quotes, { eq }) => eq(quotes.id, quoteId),
    })

    if (!quote) {
      return { success: false, error: 'Quote not found' }
    }

    // Use original quote ID for threading (parentQuoteId or quoteId)
    const originalQuoteId = quote.parentQuoteId || quote.id

    // Find the most recent email thread for this quote family
    const mostRecentEmail = await db.query.emailThreads.findFirst({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.quoteId, originalQuoteId),
          eq(emailThreads.userId, session.user.id),
        ),
      orderBy: (emailThreads, { desc }) => [desc(emailThreads.sentAt)],
    })

    if (!mostRecentEmail || !mostRecentEmail.gmailThreadId) {
      return { success: false, error: 'No conversation found for this quote' }
    }

    return {
      success: true,
      conversationId: mostRecentEmail.gmailThreadId,
    }
  } catch (error) {
    console.error('Error getting conversation ID for quote:', error)
    return { success: false, error: 'Failed to get conversation ID' }
  }
}

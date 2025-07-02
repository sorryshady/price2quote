'use server'

import { and, eq, inArray, sql } from 'drizzle-orm'

import db from '@/db'
import { emailThreads, quotes } from '@/db/schema'
import { getSession } from '@/lib/auth'

export interface EmailThread {
  id: string
  quoteId: string
  companyId: string
  gmailMessageId: string
  gmailThreadId: string | null
  to: string
  cc: string | null
  bcc: string | null
  subject: string
  body: string
  attachments: string[] | null
  includeQuotePdf: boolean | null
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

// Helper function to normalize email addresses
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// Generate conversation ID based on grouping criteria
function generateConversationId(
  quoteId: string,
  clientEmail: string,
  companyId: string,
): string {
  const normalizedEmail = normalizeEmail(clientEmail)
  return `${quoteId}-${normalizedEmail}-${companyId}`
}

export async function getEmailThreadsAction(quoteId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const threads = await db.query.emailThreads.findMany({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.quoteId, quoteId),
          eq(emailThreads.userId, session.user.id),
        ),
      orderBy: (emailThreads, { desc }) => [desc(emailThreads.sentAt)],
    })

    // Parse attachments JSON
    const parsedThreads: EmailThread[] = threads.map((thread) => ({
      ...thread,
      attachments: thread.attachments ? JSON.parse(thread.attachments) : null,
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
      quote: quoteMap.get(thread.quoteId) || undefined,
      attachments: thread.attachments ? JSON.parse(thread.attachments) : null,
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
    const conversationId = generateConversationId(
      thread.quoteId,
      thread.to,
      thread.companyId,
    )

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

    // Parse conversation ID to get quoteId, clientEmail, and companyId
    const [quoteId, clientEmail, companyId] = conversationId.split('-')

    if (!quoteId || !clientEmail || !companyId) {
      return { success: false, error: 'Invalid conversation ID' }
    }

    // Get all emails for this conversation
    const threads = await db.query.emailThreads.findMany({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.quoteId, quoteId),
          eq(emailThreads.companyId, companyId),
          eq(emailThreads.userId, session.user.id),
          sql`LOWER(TRIM(${emailThreads.to})) = LOWER(TRIM(${clientEmail}))`,
        ),
      orderBy: (emailThreads, { asc }) => [asc(emailThreads.sentAt)],
    })

    // Parse attachments JSON
    const parsedThreads: EmailThread[] = threads.map((thread) => ({
      ...thread,
      attachments: thread.attachments ? JSON.parse(thread.attachments) : null,
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

    // Parse conversation ID
    const [quoteId, clientEmail, companyId] = conversationId.split('-')

    if (!quoteId || !clientEmail || !companyId) {
      return { success: false, error: 'Invalid conversation ID' }
    }

    // Delete all emails in this conversation
    await db
      .delete(emailThreads)
      .where(
        and(
          eq(emailThreads.quoteId, quoteId),
          eq(emailThreads.companyId, companyId),
          eq(emailThreads.userId, session.user.id),
          sql`LOWER(TRIM(${emailThreads.to})) = LOWER(TRIM(${clientEmail}))`,
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

    const existingThread = await db.query.emailThreads.findFirst({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.quoteId, quoteId),
          eq(emailThreads.userId, session.user.id),
          sql`LOWER(TRIM(${emailThreads.to})) = LOWER(TRIM(${clientEmail}))`,
        ),
      orderBy: (emailThreads, { desc }) => [desc(emailThreads.sentAt)],
    })

    return {
      success: true,
      hasExistingThread: !!existingThread,
      threadCount: existingThread ? 1 : 0,
      lastSentAt: existingThread?.sentAt || null,
    }
  } catch (error) {
    console.error('Error checking existing thread:', error)
    return { success: false, error: 'Failed to check existing thread' }
  }
}

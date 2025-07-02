'use server'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { emailThreads } from '@/db/schema'
import { getSession } from '@/lib/auth'

export interface EmailThread {
  id: string
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

    // Simple query to get email threads
    const threads = await db.query.emailThreads.findMany({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.companyId, companyId),
          eq(emailThreads.userId, session.user.id),
        ),
    })

    // Parse attachments JSON
    const parsedThreads = threads.map((thread) => ({
      ...thread,
      quote: null, // We'll add quote data later if needed
      attachments: thread.attachments ? JSON.parse(thread.attachments) : null,
    }))

    return { success: true, threads: parsedThreads }
  } catch (error) {
    console.error('Error fetching email threads by company:', error)
    return { success: false, error: 'Failed to fetch email threads' }
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
          eq(emailThreads.to, clientEmail),
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

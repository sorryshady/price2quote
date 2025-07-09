'use server'

import { and, desc, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm'

import db from '@/db'
import { companies, emailThreads, quotes } from '@/db/schema'
import { getSession } from '@/lib/auth'

interface DashboardSummary {
  currentMonth: {
    quotesCreated: number
    revisionsCreated: number
    quotesAccepted: number
    quotesRevised: number
    pendingQuotes: number
    revenue: number
    currency: string
  }
  conversations: {
    total: number
    unread: number
    needingFollowUp: number
  }
}

interface ActionItem {
  id: string
  type:
    | 'quote_pending'
    | 'quote_revised'
    | 'conversation_unread'
    | 'follow_up'
    | 'draft_old'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  url: string
  daysAgo?: number
  metadata?: Record<string, unknown>
}

interface RecentActivity {
  id: string
  type:
    | 'quote_created'
    | 'quote_status_changed'
    | 'email_sent'
    | 'email_received'
    | 'system_event'
  title: string
  description: string
  timestamp: Date
  url?: string
  metadata?: Record<string, unknown>
}

export async function getDashboardSummaryAction(userId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id || session.user.id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current month start
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get current month original quotes (not revisions)
    const originalQuotes = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.userId, userId),
          gte(quotes.createdAt, currentMonthStart),
          isNull(quotes.parentQuoteId),
        ),
      )

    // Get current month revisions
    const revisionQuotes = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.userId, userId),
          gte(quotes.createdAt, currentMonthStart),
          isNotNull(quotes.parentQuoteId),
        ),
      )

    // Get ALL quotes for this month to find accepted ones (including revisions)
    const allQuotesThisMonth = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.userId, userId),
          gte(quotes.createdAt, currentMonthStart),
        ),
      )

    // Calculate metrics
    const quotesCreated = originalQuotes.length
    const revisionsCreated = revisionQuotes.length

    // For acceptance/revenue metrics, use ALL quotes (originals + revisions)
    const quotesAccepted = allQuotesThisMonth.filter(
      (q) => q.status === 'accepted' || q.status === 'paid',
    ).length
    const quotesRevised = allQuotesThisMonth.filter(
      (q) => q.status === 'revised',
    ).length
    const pendingQuotes = allQuotesThisMonth.filter(
      (q) => q.status === 'awaiting_client',
    ).length

    // Calculate revenue from ALL accepted quotes (including revised ones that got accepted)
    const acceptedQuotes = allQuotesThisMonth.filter(
      (q) => q.status === 'accepted' || q.status === 'paid',
    )
    const revenue = acceptedQuotes.reduce((sum, quote) => {
      const amount = parseFloat(quote.amount || '0')
      return sum + amount
    }, 0)

    // Get currency from first quote or default to USD
    const currency = allQuotesThisMonth[0]?.currency || 'USD'

    // Get conversation metrics
    const allEmailThreads = await db
      .select()
      .from(emailThreads)
      .where(eq(emailThreads.userId, userId))

    const totalConversations = new Set(
      allEmailThreads.map((thread) => thread.gmailThreadId),
    ).size

    // Calculate follow-ups needed (sent emails older than 3 days with no response)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const sentThreads = allEmailThreads.filter(
      (thread) =>
        thread.direction === 'outbound' && thread.sentAt < threeDaysAgo,
    )
    const needingFollowUp = sentThreads.filter((thread) => {
      // Check if there's a response after this thread
      const responses = allEmailThreads.filter(
        (t) =>
          t.gmailThreadId === thread.gmailThreadId &&
          t.direction === 'inbound' &&
          t.sentAt > thread.sentAt,
      )
      return responses.length === 0
    }).length

    const data: DashboardSummary = {
      currentMonth: {
        quotesCreated,
        revisionsCreated,
        quotesAccepted,
        quotesRevised,
        pendingQuotes,
        revenue,
        currency,
      },
      conversations: {
        total: totalConversations,
        unread: 0, // Removed as it wasn't working properly
        needingFollowUp,
      },
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    return { success: false, error: 'Failed to fetch dashboard summary' }
  }
}

export async function getActionItemsAction(userId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id || session.user.id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const items: ActionItem[] = []

    // Get quotes awaiting response (sent but not accepted/rejected)
    const pendingQuotes = await db
      .select({
        quote: quotes,
        company: companies,
      })
      .from(quotes)
      .leftJoin(companies, eq(quotes.companyId, companies.id))
      .where(
        and(eq(quotes.userId, userId), eq(quotes.status, 'awaiting_client')),
      )
      .orderBy(desc(quotes.sentAt))

    pendingQuotes.forEach(({ quote, company }) => {
      const daysSinceSent = quote.sentAt
        ? Math.floor(
            (Date.now() - quote.sentAt.getTime()) / (24 * 60 * 60 * 1000),
          )
        : 0

      items.push({
        id: `quote-pending-${quote.id}`,
        type: 'quote_pending',
        title: `Quote pending response`,
        description: `"${quote.projectTitle}" sent ${daysSinceSent} days ago`,
        priority:
          daysSinceSent > 7 ? 'high' : daysSinceSent > 3 ? 'medium' : 'low',
        url: `/conversations/${quote.id}`,
        daysAgo: daysSinceSent,
        metadata: { quoteId: quote.id, companyName: company?.name },
      })
    })

    // Get quotes in revised status
    const revisedQuotes = await db
      .select({
        quote: quotes,
        company: companies,
      })
      .from(quotes)
      .leftJoin(companies, eq(quotes.companyId, companies.id))
      .where(and(eq(quotes.userId, userId), eq(quotes.status, 'revised')))

    revisedQuotes.forEach(({ quote, company }) => {
      items.push({
        id: `quote-revised-${quote.id}`,
        type: 'quote_revised',
        title: `Quote needs revision`,
        description: `"${quote.projectTitle}" requires updates`,
        priority: 'medium',
        url: `/quotes/${quote.id}/edit`,
        metadata: { quoteId: quote.id, companyName: company?.name },
      })
    })

    // Get old draft quotes (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const oldDrafts = await db
      .select({
        quote: quotes,
        company: companies,
      })
      .from(quotes)
      .leftJoin(companies, eq(quotes.companyId, companies.id))
      .where(
        and(
          eq(quotes.userId, userId),
          eq(quotes.status, 'draft'),
          sql`${quotes.createdAt} < ${sevenDaysAgo.toISOString()}`,
        ),
      )

    oldDrafts.forEach(({ quote, company }) => {
      const daysOld = Math.floor(
        (Date.now() - quote.createdAt.getTime()) / (24 * 60 * 60 * 1000),
      )
      items.push({
        id: `draft-old-${quote.id}`,
        type: 'draft_old',
        title: `Old draft quote`,
        description: `"${quote.projectTitle}" created ${daysOld} days ago`,
        priority: 'low',
        url: `/quotes/${quote.id}/edit`,
        daysAgo: daysOld,
        metadata: { quoteId: quote.id, companyName: company?.name },
      })
    })

    // Get unread conversations
    const unreadThreads = await db
      .select({
        thread: emailThreads,
        quote: quotes,
      })
      .from(emailThreads)
      .leftJoin(quotes, eq(emailThreads.quoteId, quotes.id))
      .where(
        and(
          eq(emailThreads.userId, userId),
          eq(emailThreads.isRead, false),
          eq(emailThreads.direction, 'inbound'),
        ),
      )
      .orderBy(desc(emailThreads.sentAt))

    // Group by conversation
    const unreadConversations = new Map()
    unreadThreads.forEach(({ thread, quote }) => {
      const conversationId = thread.gmailThreadId || thread.id
      if (!unreadConversations.has(conversationId)) {
        unreadConversations.set(conversationId, { thread, quote })
      }
    })

    Array.from(unreadConversations.values()).forEach(
      ({
        thread,
        quote,
      }: {
        thread: typeof emailThreads.$inferSelect
        quote: typeof quotes.$inferSelect | null
      }) => {
        items.push({
          id: `conversation-unread-${thread.id}`,
          type: 'conversation_unread',
          title: `Unread message`,
          description: `New message about "${quote?.projectTitle || 'project'}"`,
          priority: 'high',
          url: `/conversations/${thread.gmailThreadId}`,
          metadata: { threadId: thread.id, subject: thread.subject },
        })
      },
    )

    // Sort by priority and timestamp
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    items.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return (b.daysAgo || 0) - (a.daysAgo || 0)
    })

    return { success: true, items: items.slice(0, 10) } // Limit to top 10 items
  } catch (error) {
    console.error('Error fetching action items:', error)
    return { success: false, error: 'Failed to fetch action items' }
  }
}

export async function getRecentActivityAction(userId: string) {
  try {
    const session = await getSession()
    if (!session?.user?.id || session.user.id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const activities: RecentActivity[] = []
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Get recent quotes
    const recentQuotes = await db
      .select({
        quote: quotes,
        company: companies,
      })
      .from(quotes)
      .leftJoin(companies, eq(quotes.companyId, companies.id))
      .where(
        and(eq(quotes.userId, userId), gte(quotes.createdAt, sevenDaysAgo)),
      )
      .orderBy(desc(quotes.createdAt))

    recentQuotes.forEach(({ quote, company }) => {
      activities.push({
        id: `quote-created-${quote.id}`,
        type: 'quote_created',
        title: 'Quote created',
        description: `Created "${quote.projectTitle}" for ${company?.name}`,
        timestamp: quote.createdAt,
        url: `/quotes/${quote.id}/versions`,
        metadata: { quoteId: quote.id, status: quote.status },
      })

      // Add status changes if quote was updated recently
      if (quote.updatedAt > quote.createdAt) {
        activities.push({
          id: `quote-status-${quote.id}`,
          type: 'quote_status_changed',
          title: 'Quote status updated',
          description: `"${quote.projectTitle}" is now ${quote.status}`,
          timestamp: quote.updatedAt,
          url: `/quotes/${quote.id}/versions`,
          metadata: { quoteId: quote.id, status: quote.status },
        })
      }
    })

    // Get recent email activity
    const recentEmails = await db
      .select({
        thread: emailThreads,
        quote: quotes,
      })
      .from(emailThreads)
      .leftJoin(quotes, eq(emailThreads.quoteId, quotes.id))
      .where(
        and(
          eq(emailThreads.userId, userId),
          gte(emailThreads.sentAt, sevenDaysAgo),
        ),
      )
      .orderBy(desc(emailThreads.sentAt))

    recentEmails.forEach(({ thread, quote }) => {
      const emailAddress =
        thread.direction === 'outbound'
          ? thread.to
          : thread.fromEmail || thread.to

      activities.push({
        id: `email-${thread.id}`,
        type: thread.direction === 'outbound' ? 'email_sent' : 'email_received',
        title:
          thread.direction === 'outbound' ? 'Email sent' : 'Email received',
        description: `${
          thread.direction === 'outbound' ? 'Sent to' : 'Received from'
        } ${emailAddress} about "${quote?.projectTitle || 'project'}"`,
        timestamp: thread.sentAt,
        url: `/conversations/${thread.gmailThreadId}`,
        metadata: {
          emailId: thread.id,
          subject: thread.subject,
          direction: thread.direction,
        },
      })
    })

    // Sort by timestamp (newest first) and limit
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return { success: true, activities: activities.slice(0, 20) } // Limit to 20 recent activities
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return { success: false, error: 'Failed to fetch recent activity' }
  }
}

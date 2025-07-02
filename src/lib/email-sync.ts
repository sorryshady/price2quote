import { eq } from 'drizzle-orm'

import db from '@/db'
import { emailSyncStatus, emailThreads } from '@/db/schema'
import {
  type GmailMessage,
  type ParsedEmail,
  fetchRecentEmails,
  getEmailDetails,
  markEmailAsRead,
  parseGmailMessage,
} from '@/lib/gmail'
import { getValidGmailToken } from '@/lib/gmail'

interface EmailMatchResult {
  quoteId: string | null
  confidence: 'high' | 'medium' | 'low'
  matchType: 'thread' | 'subject' | 'client' | 'body'
  reasoning: string
}

// SyncConfig interface moved to types/index.ts

export class EmailSyncService {
  // Main sync orchestration
  async syncAllCompanies(): Promise<void> {
    try {
      // Get all companies with sync enabled
      const syncStatuses = await db.query.emailSyncStatus.findMany({
        where: (emailSyncStatus, { eq }) =>
          eq(emailSyncStatus.syncEnabled, true),
      })

      for (const status of syncStatuses) {
        await this.syncCompanyEmails(status.companyId, status.userId)
      }
    } catch (error) {
      console.error('Error syncing all companies:', error)
      throw error
    }
  }

  async syncCompanyEmails(companyId: string, userId: string): Promise<void> {
    try {
      // Validate userId
      if (!userId || userId.trim() === '') {
        throw new Error('userId is required and cannot be empty')
      }

      console.log(
        `Starting sync for company ${companyId} with userId: ${userId}`,
      )

      // Get sync status for company
      let syncStatus = await db.query.emailSyncStatus.findFirst({
        where: (emailSyncStatus, { eq }) =>
          eq(emailSyncStatus.companyId, companyId),
      })

      // Create sync status if it doesn't exist (enabled by default)
      if (!syncStatus) {
        console.log(
          `Creating sync status for company ${companyId} with userId: ${userId}`,
        )
        const [newSyncStatus] = await db
          .insert(emailSyncStatus)
          .values({
            companyId,
            userId: userId,
            syncEnabled: true,
            lastSyncAt: new Date(),
            lastMessageId: null,
          })
          .returning()

        syncStatus = newSyncStatus
      } else if (!syncStatus.userId) {
        // Update existing record if userId is null
        console.log(
          `Updating sync status userId for company ${companyId} with userId: ${userId}`,
        )
        const [updatedSyncStatus] = await db
          .update(emailSyncStatus)
          .set({
            userId: userId,
            lastSyncAt: new Date(),
          })
          .where(eq(emailSyncStatus.companyId, companyId))
          .returning()

        syncStatus = updatedSyncStatus
      }

      if (!syncStatus.syncEnabled) {
        console.log(`Sync disabled for company ${companyId}`)
        return
      }

      // Get Gmail connection for company
      const gmailConnection = await db.query.gmailConnections.findFirst({
        where: (gmailConnections, { eq, and }) =>
          and(
            eq(gmailConnections.companyId, companyId),
            eq(gmailConnections.userId, syncStatus.userId),
          ),
      })

      if (!gmailConnection) {
        console.log(`No Gmail connection found for company ${companyId}`)
        return
      }

      // Get valid access token
      const accessToken = await getValidGmailToken(
        gmailConnection.accessToken,
        gmailConnection.refreshToken,
        gmailConnection.expiresAt,
      )

      // Fetch recent emails
      const emails = await fetchRecentEmails(accessToken, 50, 'is:unread')

      console.log(
        `Found ${emails.length} unread emails for company ${companyId}`,
      )

      // Process each email
      for (const email of emails) {
        await this.processIncomingEmail(email, accessToken, companyId, userId)
      }

      // Update sync status with last email ID
      if (emails.length > 0) {
        await this.updateSyncStatus(companyId, emails[emails.length - 1].id)
      } else {
        // Update sync timestamp even when no emails found
        await this.updateSyncStatus(companyId, syncStatus.lastMessageId || '')
      }
    } catch (error) {
      console.error(`Error syncing company ${companyId}:`, error)
      throw error
    }
  }

  // Email processing
  async processIncomingEmail(
    email: GmailMessage,
    accessToken: string,
    companyId: string,
    userId?: string,
  ): Promise<void> {
    try {
      // Get detailed email content
      const emailDetails = await getEmailDetails(accessToken, email.id)
      const parsedEmail = parseGmailMessage(emailDetails)

      console.log(
        `Processing email: ${parsedEmail.subject} from ${parsedEmail.fromEmail}`,
      )

      // Check if we should process this email
      if (!(await this.shouldProcessEmail(parsedEmail))) {
        console.log(`Skipping email: ${parsedEmail.subject} - filtered out`)
        return
      }

      // Match email to quote
      const matchResult = await this.matchEmailToQuote(parsedEmail, companyId)
      console.log(`Email match result:`, matchResult)

      if (matchResult.quoteId) {
        // Store email in database
        await this.storeIncomingEmail(
          parsedEmail,
          companyId,
          matchResult.quoteId,
          userId,
        )

        // Update quote status if needed
        await this.updateQuoteStatusFromEmail(parsedEmail, matchResult.quoteId)

        // Mark email as read in Gmail
        await markEmailAsRead(accessToken, email.id)

        console.log(
          `Successfully processed email for quote: ${matchResult.quoteId}`,
        )
      } else {
        console.log(`No quote match found for email: ${parsedEmail.subject}`)
      }
    } catch (error) {
      console.error('Error processing incoming email:', error)
      throw error
    }
  }

  async matchEmailToQuote(
    email: ParsedEmail,
    companyId: string,
  ): Promise<EmailMatchResult> {
    // Strategy 1: Thread ID matching (most reliable)
    const threadMatch = await this.findQuoteByThreadId(
      email.threadId,
      companyId,
    )
    if (threadMatch) {
      return {
        quoteId: threadMatch,
        confidence: 'high',
        matchType: 'thread',
        reasoning: 'Matched by Gmail thread ID',
      }
    }

    // Strategy 2: Subject line matching with quote ID
    const subjectMatch = await this.findQuoteBySubject(email.subject, companyId)
    if (subjectMatch) {
      return {
        quoteId: subjectMatch,
        confidence: 'high',
        matchType: 'subject',
        reasoning: 'Matched by quote ID in subject',
      }
    }

    // Strategy 3: Client email matching
    const clientMatch = await this.findQuoteByClientEmail(
      email.fromEmail,
      companyId,
    )
    if (clientMatch) {
      return {
        quoteId: clientMatch,
        confidence: 'medium',
        matchType: 'client',
        reasoning: 'Matched by client email address',
      }
    }

    // Strategy 4: Quote reference in email body
    const bodyMatch = await this.findQuoteByBodyContent(email.body, companyId)
    if (bodyMatch) {
      return {
        quoteId: bodyMatch,
        confidence: 'low',
        matchType: 'body',
        reasoning: 'Matched by quote reference in email body',
      }
    }

    return {
      quoteId: null,
      confidence: 'low',
      matchType: 'body',
      reasoning: 'No match found',
    }
  }

  async updateQuoteStatusFromEmail(
    email: ParsedEmail,
    quoteId: string,
  ): Promise<void> {
    // TODO: Implement AI analysis for quote status updates
    // This will be enhanced in Phase 6
    console.log(`Quote status update for ${quoteId} based on email content`)
  }

  // Utility methods
  async shouldProcessEmail(email: ParsedEmail): Promise<boolean> {
    // Skip emails from self (company's own Gmail account)
    // This should be more specific - only filter out the company's own email
    // For now, let's be less restrictive and let the matching logic handle it

    // Skip emails with certain labels
    const excludeLabels = ['SPAM', 'TRASH', 'DRAFT']
    if (email.labelIds.some((label: string) => excludeLabels.includes(label))) {
      return false
    }

    return true
  }

  async isEmailFromClient(email: ParsedEmail): Promise<boolean> {
    // Check if email is from a known client
    const clientQuotes = await db.query.quotes.findMany({
      where: (quotes, { eq }) => eq(quotes.clientEmail, email.fromEmail),
    })

    return clientQuotes.length > 0
  }

  // Matching strategies
  private async findQuoteByThreadId(
    threadId: string,
    companyId: string,
  ): Promise<string | null> {
    const existingThread = await db.query.emailThreads.findFirst({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.gmailThreadId, threadId),
          eq(emailThreads.companyId, companyId),
        ),
    })

    return existingThread?.quoteId || null
  }

  private async findQuoteBySubject(
    subject: string,
    companyId: string,
  ): Promise<string | null> {
    // Look for quote ID in subject (e.g., "Re: Quote #12345")
    const quoteIdMatch = subject.match(/quote\s*#?([a-f0-9-]+)/i)
    if (quoteIdMatch) {
      const quoteId = quoteIdMatch[1]
      const quote = await db.query.quotes.findFirst({
        where: (quotes, { eq, and }) =>
          and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)),
      })
      return quote?.id || null
    }

    return null
  }

  private async findQuoteByClientEmail(
    fromEmail: string,
    companyId: string,
  ): Promise<string | null> {
    const quote = await db.query.quotes.findFirst({
      where: (quotes, { eq, and }) =>
        and(eq(quotes.clientEmail, fromEmail), eq(quotes.companyId, companyId)),
      orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
    })

    return quote?.id || null
  }

  private async findQuoteByBodyContent(
    body: string,
    companyId: string,
  ): Promise<string | null> {
    // Look for quote ID in email body
    const quoteIdMatch = body.match(/quote\s*#?([a-f0-9-]+)/i)
    if (quoteIdMatch) {
      const quoteId = quoteIdMatch[1]
      const quote = await db.query.quotes.findFirst({
        where: (quotes, { eq, and }) =>
          and(eq(quotes.id, quoteId), eq(quotes.companyId, companyId)),
      })
      return quote?.id || null
    }

    return null
  }

  private async storeIncomingEmail(
    email: ParsedEmail,
    companyId: string,
    quoteId: string,
    userId?: string,
  ): Promise<void> {
    await db.insert(emailThreads).values({
      userId: userId || '',
      companyId,
      quoteId,
      gmailMessageId: email.id,
      gmailThreadId: email.threadId,
      direction: 'inbound',
      fromEmail: email.fromEmail,
      to: email.toEmail,
      subject: email.subject,
      body: email.body,
      attachments:
        email.attachments.length > 0
          ? JSON.stringify(email.attachments.map((a) => a.filename))
          : null,
      isRead: false,
      gmailLabels: JSON.stringify(email.labelIds),
      emailType: 'client_response',
    })
  }

  private async updateSyncStatus(
    companyId: string,
    lastMessageId: string,
  ): Promise<void> {
    await db
      .update(emailSyncStatus)
      .set({
        lastSyncAt: new Date(),
        lastMessageId,
      })
      .where(eq(emailSyncStatus.companyId, companyId))
  }
}

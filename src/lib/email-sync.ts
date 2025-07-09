import { eq } from 'drizzle-orm'

import db from '@/db'
import { emailSyncStatus, emailThreads } from '@/db/schema'
import {
  type GmailMessage,
  type ParsedEmail,
  fetchThreadMessages,
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

  async syncCompanyEmails(
    companyId: string,
    userId: string,
  ): Promise<{ updatedConversations: string[] }> {
    const updatedConversations: string[] = []

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
        return { updatedConversations }
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
        return { updatedConversations }
      }

      // Note: accessToken is used in checkThreadForNewEmails method

      // Get all outbound emails for this company that we've sent
      const outboundEmails = await db.query.emailThreads.findMany({
        where: (emailThreads, { eq, and }) =>
          and(
            eq(emailThreads.companyId, companyId),
            eq(emailThreads.direction, 'outbound'),
          ),
      })

      console.log(
        `Found ${outboundEmails.length} outbound emails to check for responses`,
      )

      // Check each outbound email's thread for new responses
      for (const outboundEmail of outboundEmails) {
        if (outboundEmail.gmailThreadId) {
          const hasUpdates = await this.checkThreadForNewEmails(
            companyId,
            outboundEmail.gmailThreadId,
            userId,
          )
          if (hasUpdates) {
            updatedConversations.push(outboundEmail.gmailThreadId)
          }
        }
      }

      // Note: Removed outbound email read status sync - keeping it simple

      // Update sync status with current timestamp
      await this.updateSyncStatus(companyId, new Date().toISOString())

      return { updatedConversations }
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
    gmailSenderEmail?: string,
  ): Promise<void> {
    try {
      // Get detailed email content
      const emailDetails = await getEmailDetails(accessToken, email.id)
      const parsedEmail = parseGmailMessage(emailDetails)

      // Determine direction
      const direction =
        gmailSenderEmail &&
        parsedEmail.fromEmail.toLowerCase() === gmailSenderEmail.toLowerCase()
          ? 'outbound'
          : 'inbound'

      console.log(
        `Processing email: ${parsedEmail.subject} from ${parsedEmail.fromEmail} [${direction}]`,
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
          direction,
        )

        // Update quote status if needed
        await this.updateQuoteStatusFromEmail(parsedEmail, matchResult.quoteId)

        // Only mark as read in Gmail for inbound
        if (direction === 'inbound') {
          try {
            await markEmailAsRead(accessToken, email.id)
          } catch (error) {
            console.warn(`Could not mark email as read in Gmail: ${error}`)
            // Continue processing even if marking as read fails
          }
        }

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
    console.log(`Matching email "${email.subject}" from ${email.fromEmail}`)

    // Strategy 1: Thread ID matching (most reliable)
    const threadMatch = await this.findQuoteByThreadId(
      email.threadId,
      companyId,
    )
    if (threadMatch) {
      console.log(`Found thread match: ${threadMatch}`)
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
      console.log(`Found subject match: ${subjectMatch}`)
      return {
        quoteId: subjectMatch,
        confidence: 'high',
        matchType: 'subject',
        reasoning: 'Matched by quote ID in subject',
      }
    }

    // Strategy 3: Client email matching (most common for replies)
    const clientMatch = await this.findQuoteByClientEmail(
      email.fromEmail,
      companyId,
    )
    if (clientMatch) {
      console.log(`Found client email match: ${clientMatch}`)
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
      console.log(`Found body match: ${bodyMatch}`)
      return {
        quoteId: bodyMatch,
        confidence: 'low',
        matchType: 'body',
        reasoning: 'Matched by quote reference in email body',
      }
    }

    console.log(`No match found for email from ${email.fromEmail}`)
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

    // Skip promotional/marketing emails from known services
    const promotionalDomains = [
      'duolingo.com',
      'spotify.com',
      'netflix.com',
      'amazon.com',
      'ebay.com',
      'linkedin.com',
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'youtube.com',
      'google.com',
      'microsoft.com',
      'apple.com',
      'salesforce.com',
      'hubspot.com',
      'mailchimp.com',
      'constantcontact.com',
      'sendgrid.com',
      'stripe.com',
      'paypal.com',
    ]

    const fromDomain = email.fromEmail.split('@')[1]?.toLowerCase()
    if (fromDomain && promotionalDomains.includes(fromDomain)) {
      console.log(`Skipping promotional email from ${fromDomain}`)
      return false
    }

    // Skip emails with promotional keywords in subject
    const promotionalKeywords = [
      'newsletter',
      'promotion',
      'offer',
      'discount',
      'sale',
      // 'marketing',
      'advertisement',
      'sponsored',
      'unsubscribe',
      'confirm your email',
      'verify your email',
      'welcome to',
      'your account',
      'password reset',
      'security alert',
    ]

    const subjectLower = email.subject.toLowerCase()
    if (promotionalKeywords.some((keyword) => subjectLower.includes(keyword))) {
      console.log(`Skipping promotional email with subject: ${email.subject}`)
      return false
    }

    // Note: A simple check, can be improved with more sophisticated NLP
    const promotionalSubjects = [
      'sale',
      'discount',
      'offer',
      'newsletter',
      'webinar',
      'download',
      'ebook',
      'free',
    ]
    if (
      promotionalSubjects.some((term) =>
        email.subject.toLowerCase().includes(term),
      )
    ) {
      console.log(`Skipping promotional email with subject: ${email.subject}`)
      return false
    }

    // Check for unsubscribe links (common in promotional emails)
    // const unsubscribeRegex = /unsubscribe|manage your subscription/i
    // if (unsubscribeRegex.test(email.body)) {
    //   console.log('Skipping email with unsubscribe link')
    //   return false
    // }

    // All checks passed, process the email
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
    console.log(`Looking for existing thread: ${threadId}`)

    const existingThread = await db.query.emailThreads.findFirst({
      where: (emailThreads, { eq, and }) =>
        and(
          eq(emailThreads.gmailThreadId, threadId),
          eq(emailThreads.companyId, companyId),
        ),
    })

    if (existingThread) {
      console.log(`Found existing thread for quote: ${existingThread.quoteId}`)

      // Validate that this quote still exists and belongs to the company
      const quote = await db.query.quotes.findFirst({
        where: (quotes, { eq, and }) =>
          and(
            eq(quotes.id, existingThread.quoteId),
            eq(quotes.companyId, companyId),
          ),
      })

      if (quote) {
        return existingThread.quoteId
      } else {
        console.log(
          `Quote ${existingThread.quoteId} no longer exists, ignoring thread match`,
        )
        return null
      }
    }

    return null
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
    console.log(`Looking for quotes with client email: ${fromEmail}`)

    // Get all quotes for this company
    const quotes = await db.query.quotes.findMany({
      where: (quotes, { eq, and }) => and(eq(quotes.companyId, companyId)),
      orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
    })

    console.log(`Found ${quotes.length} quotes for company ${companyId}`)

    // Look for exact match first
    const exactMatch = quotes.find(
      (quote) => quote.clientEmail?.toLowerCase() === fromEmail.toLowerCase(),
    )

    if (exactMatch) {
      console.log(`Found exact client email match: ${exactMatch.id}`)
      return exactMatch.id
    }

    // Look for partial match (domain match)
    const fromDomain = fromEmail.split('@')[1]?.toLowerCase()
    if (fromDomain) {
      const domainMatch = quotes.find((quote) =>
        quote.clientEmail?.toLowerCase().includes(fromDomain),
      )

      if (domainMatch) {
        console.log(
          `Found domain match: ${domainMatch.id} (${domainMatch.clientEmail})`,
        )
        return domainMatch.id
      }
    }

    // Look for most recent quote as fallback
    if (quotes.length > 0) {
      console.log(`Using most recent quote as fallback: ${quotes[0].id}`)
      return quotes[0].id
    }

    console.log(`No client email match found`)
    return null
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
    direction: 'inbound' | 'outbound' = 'inbound',
  ): Promise<void> {
    await db.insert(emailThreads).values({
      userId: userId || '',
      companyId,
      quoteId,
      gmailMessageId: email.id,
      gmailThreadId: email.threadId,
      direction,
      fromEmail: email.fromEmail,
      to: email.toEmail,
      subject: email.subject,
      body: email.body,
      attachments:
        email.attachments.length > 0
          ? JSON.stringify(email.attachments.map((a) => a.filename))
          : null,
      isRead: direction === 'outbound' ? false : false, // Outbound: only mark as read if client opens
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

  async checkThreadForNewEmails(
    companyId: string,
    threadId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      console.log(`Checking thread ${threadId} for new emails`)

      // Get Gmail connection for company
      const gmailConnection = await db.query.gmailConnections.findFirst({
        where: (gmailConnections, { eq, and }) =>
          and(
            eq(gmailConnections.companyId, companyId),
            eq(gmailConnections.userId, userId),
          ),
      })

      if (!gmailConnection) {
        console.log(`No Gmail connection found for company ${companyId}`)
        return false
      }

      // Get valid access token
      const accessToken = await getValidGmailToken(
        gmailConnection.accessToken,
        gmailConnection.refreshToken,
        gmailConnection.expiresAt,
      )

      // Get all messages in the thread
      const threadMessages = await fetchThreadMessages(accessToken, threadId)
      console.log(
        `Found ${threadMessages.length} messages in thread ${threadId}`,
      )

      // Get existing emails for this thread from our database
      const existingEmails = await db.query.emailThreads.findMany({
        where: (emailThreads, { eq, and }) =>
          and(
            eq(emailThreads.gmailThreadId, threadId),
            eq(emailThreads.companyId, companyId),
          ),
      })

      const existingMessageIds = new Set(
        existingEmails.map((e) => e.gmailMessageId),
      )
      console.log(
        `Already have ${existingMessageIds.size} emails from this thread`,
      )

      // Find new messages that we haven't processed yet
      const newMessages = threadMessages.filter(
        (msg) => !existingMessageIds.has(msg.id),
      )
      console.log(
        `Found ${newMessages.length} new messages in thread ${threadId}`,
      )

      // Process only the new messages
      for (const message of newMessages) {
        await this.processIncomingEmail(
          message,
          accessToken,
          companyId,
          userId,
          gmailConnection.gmailEmail,
        )
      }

      return newMessages.length > 0
    } catch (error) {
      console.error(`Error checking thread ${threadId} for new emails:`, error)
      // Don't throw error to avoid stopping other threads
      return false
    }
  }
}

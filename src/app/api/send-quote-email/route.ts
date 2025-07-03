import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { quotes } from '@/db/schema'
import { getSession } from '@/lib/auth'
import {
  findExistingEmailThread,
  getOriginalQuoteIdForThreading,
  saveEmailThreadWithRevisionContext,
} from '@/lib/email-threading'
import { getValidGmailToken } from '@/lib/gmail'
import { generateQuotePDF } from '@/lib/pdf-utils'
import { supabase } from '@/lib/supabase'
import type { Quote } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const to = formData.get('to') as string
    const cc = formData.get('cc') as string
    const bcc = formData.get('bcc') as string
    const subject = formData.get('subject') as string
    const body = formData.get('body') as string
    const quoteId = formData.get('quoteId') as string
    const includeQuotePdf = formData.get('includeQuotePdf') === 'true'
    const attachmentFiles = formData.getAll('attachments') as File[]

    // Validate required fields
    if (!to || !subject || !body || !quoteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Get the quote data
    // Get quote data
    const quoteData = await db.query.quotes.findFirst({
      where: (quotes, { eq }) => eq(quotes.id, quoteId),
    })

    if (!quoteData) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Get company data separately
    const companyData = await db.query.companies.findFirst({
      where: (companies, { eq }) => eq(companies.id, quoteData.companyId),
    })

    // Combine quote and company data
    const quoteWithCompany = {
      ...quoteData,
      company: companyData,
    }

    // Check if user owns this quote
    if (quoteData.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Gmail connection for the company
    const gmailConnection = await db.query.gmailConnections.findFirst({
      where: (gmailConnections, { eq }) =>
        eq(gmailConnections.companyId, quoteData.companyId),
    })

    if (!gmailConnection) {
      return NextResponse.json(
        { error: 'Gmail not connected for this company' },
        { status: 400 },
      )
    }

    // Prepare attachments
    const attachments: Array<{
      filename: string
      content: Buffer
      contentType: string
    }> = []

    // Generate quote PDF if requested
    if (includeQuotePdf) {
      try {
        const quotePdfBlob = await generateQuotePDF(quoteWithCompany as Quote)
        const quotePdfBuffer = Buffer.from(await quotePdfBlob.arrayBuffer())
        attachments.push({
          filename: `${quoteData.projectTitle} - Quote.pdf`,
          content: quotePdfBuffer,
          contentType: 'application/pdf',
        })
      } catch (error) {
        console.error('Error generating quote PDF:', error)
        return NextResponse.json(
          { error: 'Failed to generate quote PDF' },
          { status: 500 },
        )
      }
    }

    // Process file attachments
    for (const file of attachmentFiles) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        attachments.push({
          filename: file.name,
          content: buffer,
          contentType: file.type,
        })
      } catch (error) {
        console.error('Error processing attachment:', error)
        return NextResponse.json(
          { error: `Failed to process attachment: ${file.name}` },
          { status: 500 },
        )
      }
    }

    // Upload attachments to Supabase storage for record keeping (optional)
    const uploadedAttachments: string[] = []
    if (attachments.length > 0) {
      try {
        for (const attachment of attachments) {
          const fileName = `email-attachments/${Date.now()}-${attachment.filename}`
          const { error } = await supabase.storage
            .from('email-attachments')
            .upload(fileName, attachment.content, {
              contentType: attachment.contentType,
            })

          if (error) {
            console.error('Error uploading attachment to Supabase:', error)
            // Continue with email sending even if upload fails
          } else {
            uploadedAttachments.push(fileName)
          }
        }
      } catch (error) {
        console.error('Error uploading attachments to Supabase:', error)
        // Continue with email sending even if upload fails
      }
    }

    // Get the original quote ID for conversation threading
    const originalQuoteId = getOriginalQuoteIdForThreading(quoteData)

    // Check for existing email thread to continue conversation
    const { threadId: existingThreadId } = await findExistingEmailThread(
      session.user.id,
      quoteId,
      to,
    )

    // Get valid access token (refresh if needed)
    const validAccessToken = await getValidGmailToken(
      gmailConnection.accessToken,
      gmailConnection.refreshToken,
      gmailConnection.expiresAt,
    )

    // Send email via Gmail API
    try {
      const gmailResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${validAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            raw: await createGmailMessage({
              to,
              cc,
              bcc,
              subject,
              body,
              attachments,
              from: gmailConnection.gmailEmail,
            }),
            // Include thread ID if this is a follow-up email
            ...(existingThreadId && {
              threadId: existingThreadId,
            }),
          }),
        },
      )

      if (!gmailResponse.ok) {
        const errorData = await gmailResponse.json()
        console.error('Gmail API error:', errorData)
        return NextResponse.json(
          { error: 'Failed to send email via Gmail' },
          { status: 500 },
        )
      }

      const gmailResult = await gmailResponse.json()
      const messageId = gmailResult.id
      const threadId = gmailResult.threadId

      // Save email thread for conversation tracking with revision context
      try {
        const isRevision = quoteData.parentQuoteId !== null
        await saveEmailThreadWithRevisionContext({
          userId: session.user.id,
          companyId: quoteData.companyId,
          quoteId: quoteId,
          originalQuoteId: originalQuoteId,
          gmailMessageId: messageId,
          gmailThreadId: existingThreadId || threadId,
          to: to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject: subject,
          body: body,
          attachments:
            uploadedAttachments.length > 0
              ? JSON.stringify(uploadedAttachments)
              : undefined,
          includeQuotePdf: includeQuotePdf,
          revisionContext: isRevision
            ? {
                versionNumber: quoteData.versionNumber,
                revisionNotes: quoteData.revisionNotes || undefined,
                isRevision: true,
              }
            : undefined,
        })
      } catch (error) {
        console.error('Error saving email thread:', error)
        // Continue even if thread saving fails
      }

      // Update quote status to 'sent' if it was 'draft' or 'revised'
      if (quoteData.status === 'draft' || quoteData.status === 'revised') {
        await db
          .update(quotes)
          .set({ status: 'sent' })
          .where(eq(quotes.id, quoteId))
      }

      return NextResponse.json({
        success: true,
        messageId: messageId,
        threadId: threadId,
        attachments: uploadedAttachments,
      })
    } catch (error) {
      console.error('Error sending email:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Error in send-quote-email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

async function createGmailMessage({
  to,
  cc,
  bcc,
  subject,
  body,
  attachments,
  from,
}: {
  to: string
  cc?: string
  bcc?: string
  subject: string
  body: string
  attachments: Array<{ filename: string; content: Buffer; contentType: string }>
  from: string
}): Promise<string> {
  const boundary = `boundary_${Math.random().toString(36).substring(2)}`

  let message = `From: ${from}\r\n`
  message += `To: ${to}\r\n`
  if (cc) message += `Cc: ${cc}\r\n`
  if (bcc) message += `Bcc: ${bcc}\r\n`
  message += `Subject: ${subject}\r\n`
  message += `MIME-Version: 1.0\r\n`
  message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`

  // Add text body
  message += `--${boundary}\r\n`
  message += `Content-Type: text/plain; charset=UTF-8\r\n`
  message += `Content-Transfer-Encoding: 7bit\r\n\r\n`
  message += `${body}\r\n\r\n`

  // Add attachments
  for (const attachment of attachments) {
    message += `--${boundary}\r\n`
    message += `Content-Type: ${attachment.contentType}; name="${attachment.filename}"\r\n`
    message += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`
    message += `Content-Transfer-Encoding: base64\r\n\r\n`
    message += `${attachment.content.toString('base64')}\r\n\r\n`
  }

  message += `--${boundary}--\r\n`

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

import { env } from '@/env/server'

interface GmailTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: GmailMessagePayload
  internalDate: string
}

interface GmailMessagePayload {
  headers: GmailHeader[]
  parts?: GmailMessagePayload[]
  body?: GmailMessageBody
  mimeType?: string
}

interface GmailHeader {
  name: string
  value: string
}

interface GmailMessageBody {
  data?: string
  attachmentId?: string
}

export interface ParsedEmail {
  id: string
  threadId: string
  fromEmail: string
  toEmail: string
  subject: string
  body: string
  snippet: string
  labelIds: string[]
  internalDate: string
  attachments: Attachment[]
}

interface Attachment {
  id: string
  filename: string
  mimeType: string
  size: number
}

interface EmailAddresses {
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
}

export async function refreshGmailToken(
  refreshToken: string,
): Promise<GmailTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh Gmail token: ${error}`)
  }

  return response.json()
}

export async function getValidGmailToken(
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date,
): Promise<string> {
  // Check if token is expired (with 5 minute buffer)
  const now = new Date()
  const expiresAtWithBuffer = new Date(expiresAt.getTime() - 5 * 60 * 1000)

  if (now > expiresAtWithBuffer && refreshToken) {
    try {
      const tokenResponse = await refreshGmailToken(refreshToken)
      return tokenResponse.access_token
    } catch (error) {
      console.error('Error refreshing Gmail token:', error)
      throw new Error('Failed to refresh Gmail token')
    }
  }

  return accessToken
}

// Fetch all messages in a thread
export async function fetchThreadMessages(
  accessToken: string,
  threadId: string,
): Promise<GmailMessage[]> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch thread messages: ${response.statusText}`)
  }

  const data = await response.json()
  return data.messages || []
}

// Fetch recent emails from inbox
export async function fetchRecentEmails(
  accessToken: string,
  maxResults: number = 50,
  query?: string,
): Promise<GmailMessage[]> {
  let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&format=full`

  if (query) {
    url += `&q=${encodeURIComponent(query)}`
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch recent emails: ${response.statusText}`)
  }

  const data = await response.json()
  return data.messages || []
}

// Get detailed email content
export async function getEmailDetails(
  accessToken: string,
  messageId: string,
): Promise<GmailMessage> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to get email details: ${response.statusText}`)
  }

  return response.json()
}

// Mark email as read
export async function markEmailAsRead(
  accessToken: string,
  messageId: string,
): Promise<void> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        removeLabelIds: ['UNREAD'],
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to mark email as read: ${response.statusText}`)
  }
}

// Search emails by criteria
export async function searchEmails(
  accessToken: string,
  query: string,
  maxResults: number = 50,
): Promise<GmailMessage[]> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
      query,
    )}&maxResults=${maxResults}&format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to search emails: ${response.statusText}`)
  }

  const data = await response.json()
  return data.messages || []
}

// Email parsing and processing utilities
export function parseGmailMessage(message: GmailMessage): ParsedEmail {
  const headers = message.payload.headers
  const fromEmail = getHeaderValue(headers, 'From') || ''
  const toEmail = getHeaderValue(headers, 'To') || ''
  const subject = getHeaderValue(headers, 'Subject') || ''
  const body = decodeEmailBody(message.payload)
  const attachments = extractAttachments(message.payload)

  return {
    id: message.id,
    threadId: message.threadId,
    fromEmail,
    toEmail,
    subject,
    body,
    snippet: message.snippet,
    labelIds: message.labelIds,
    internalDate: message.internalDate,
    attachments,
  }
}

export function extractEmailAddresses(headers: GmailHeader[]): EmailAddresses {
  const from = getHeaderValue(headers, 'From') || ''
  const to = getHeaderValue(headers, 'To') || ''
  const cc = getHeaderValue(headers, 'Cc') || ''
  const bcc = getHeaderValue(headers, 'Bcc') || ''

  return {
    from,
    to: to.split(',').map((email) => email.trim()),
    cc: cc ? cc.split(',').map((email) => email.trim()) : undefined,
    bcc: bcc ? bcc.split(',').map((email) => email.trim()) : undefined,
  }
}

export function decodeEmailBody(payload: GmailMessagePayload): string {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }

  if (payload.parts) {
    // Find the text/plain part
    const textPart = payload.parts.find(
      (part) => part.mimeType === 'text/plain',
    )
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, 'base64').toString('utf-8')
    }

    // Fallback to text/html
    const htmlPart = payload.parts.find((part) => part.mimeType === 'text/html')
    if (htmlPart?.body?.data) {
      return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8')
    }
  }

  return ''
}

export function extractAttachments(payload: GmailMessagePayload): Attachment[] {
  const attachments: Attachment[] = []

  function extractFromPayload(payload: GmailMessagePayload) {
    if (payload.body?.attachmentId) {
      attachments.push({
        id: payload.body.attachmentId,
        filename: getHeaderValue(payload.headers, 'Content-Disposition') || '',
        mimeType: getHeaderValue(payload.headers, 'Content-Type') || '',
        size: 0, // Size would need to be fetched separately
      })
    }

    if (payload.parts) {
      payload.parts.forEach(extractFromPayload)
    }
  }

  extractFromPayload(payload)
  return attachments
}

function getHeaderValue(headers: GmailHeader[], name: string): string {
  const header = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase(),
  )
  return header?.value || ''
}

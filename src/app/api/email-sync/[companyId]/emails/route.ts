import { NextRequest, NextResponse } from 'next/server'

import { and, eq } from 'drizzle-orm'

import db from '@/db'
import { gmailConnections } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { fetchRecentEmails, getValidGmailToken } from '@/lib/gmail'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = await params
    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get('maxResults') || '50')
    const query = searchParams.get('query') || undefined

    // Get Gmail connection for company
    const gmailConnection = await db
      .select()
      .from(gmailConnections)
      .where(
        and(
          eq(gmailConnections.companyId, companyId),
          eq(gmailConnections.userId, session.user.id),
        ),
      )
      .limit(1)
      .then((results) => results[0])

    if (!gmailConnection) {
      return NextResponse.json(
        { error: 'No Gmail connection found for this company' },
        { status: 404 },
      )
    }

    // Get valid access token
    const accessToken = await getValidGmailToken(
      gmailConnection.accessToken,
      gmailConnection.refreshToken,
      gmailConnection.expiresAt,
    )

    // Fetch recent emails
    const emails = await fetchRecentEmails(accessToken, maxResults, query)

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
    })
  } catch (error) {
    console.error('Error fetching company emails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company emails' },
      { status: 500 },
    )
  }
}

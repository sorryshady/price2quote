'use server'

import { eq } from 'drizzle-orm'

import db from '@/db'
import { companies, gmailConnections } from '@/db/schema'
import { env } from '@/env/server'
import { getUser } from '@/lib/auth'

export async function getGmailConnectionAction(companyId: string) {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const connection = await db.query.gmailConnections.findFirst({
      where: eq(gmailConnections.companyId, companyId),
    })

    if (!connection) {
      return { success: false, error: 'No Gmail connection found' }
    }

    // Check if token is expired
    const isExpired = connection.expiresAt < new Date()

    return {
      success: true,
      connection: {
        ...connection,
        isExpired,
      },
    }
  } catch (error) {
    console.error('Error getting Gmail connection:', error)
    return { success: false, error: 'Failed to get Gmail connection' }
  }
}

export async function disconnectGmailAction(companyId: string) {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Delete Gmail connection
    await db
      .delete(gmailConnections)
      .where(eq(gmailConnections.companyId, companyId))

    // Clear company email field
    await db
      .update(companies)
      .set({ email: null })
      .where(eq(companies.id, companyId))

    return { success: true }
  } catch (error) {
    console.error('Error disconnecting Gmail:', error)
    return { success: false, error: 'Failed to disconnect Gmail' }
  }
}

export async function refreshGmailTokenAction(companyId: string) {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const connection = await db.query.gmailConnections.findFirst({
      where: eq(gmailConnections.companyId, companyId),
    })

    if (!connection || !connection.refreshToken) {
      return { success: false, error: 'No refresh token available' }
    }

    // Refresh the token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: connection.refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      return { success: false, error: 'Failed to refresh token' }
    }

    const tokens = await response.json()

    // Update the connection with new tokens
    await db
      .update(gmailConnections)
      .set({
        accessToken: tokens.access_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        updatedAt: new Date(),
      })
      .where(eq(gmailConnections.companyId, companyId))

    return { success: true }
  } catch (error) {
    console.error('Error refreshing Gmail token:', error)
    return { success: false, error: 'Failed to refresh token' }
  }
}

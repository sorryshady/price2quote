import { env } from '@/env/server'

interface GmailTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
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

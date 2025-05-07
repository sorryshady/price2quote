import { NextRequest, NextResponse } from 'next/server'

import { sendEmail } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { html, userEmail, purpose } = body
  if (!html || !userEmail || !purpose) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }
  if (purpose === 'email-verification') {
    try {
      await sendEmail({
        to: userEmail,
        subject: 'Verify your email',
        html,
      })
      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
      console.error(error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 },
      )
    }
  } else if (purpose === 'password-reset') {
    try {
      await sendEmail({
        to: userEmail,
        subject: 'Reset your password',
        html,
      })
      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
      console.error(error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 },
      )
    }
  }
}

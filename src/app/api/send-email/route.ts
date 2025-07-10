import { NextRequest, NextResponse } from 'next/server'

import { Resend } from 'resend'

import ForgotPassword from '@/email-templates/forgot-password'
import VerifyEmail from '@/email-templates/verify-email'
import { env } from '@/env/server'

// import { sendEmail } from '@/lib/mailer'

const resend = new Resend(env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { info, userEmail, purpose } = body
  if (!userEmail || !purpose || !info) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }
  if (purpose === 'email-verification') {
    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: userEmail,
        subject: 'Verify your email',
        react: VerifyEmail({
          userName: info.userName,
          requestIp: info.requestIp,
          requestLocation: info.requestLocation,
          verificationUrl: info.verificationUrl,
        }),
      })
      // await sendEmail({
      //   to: userEmail,
      //   subject: 'Verify your email',
      //   html,
      // })
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
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: userEmail,
        subject: 'Reset your password',
        react: ForgotPassword({
          userName: info.userName,
          passwordResetUrl: info.passwordResetUrl,
          requestIp: info.requestIp,
          requestLocation: info.requestLocation,
        }),
      })
      // await sendEmail({
      //   to: userEmail,
      //   subject: 'Reset your password',
      //   html,
      // })
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

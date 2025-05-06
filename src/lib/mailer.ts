import { render } from '@react-email/render'
import nodemailer from 'nodemailer'

import { env } from '@/env/server'

const isProduction = env.NODE_ENV === 'production'

const transporter = nodemailer.createTransport(
  isProduction
    ? {
        host: 'smtp.resend.com',
        port: 587,
        auth: {
          user: env.RESEND_API_KEY,
          pass: '',
        },
      }
    : {
        host: env.MAILHOG_HOST,
        port: env.MAILHOG_PORT,
        secure: false,
      },
)

type SendEmailParams = {
  to: string
  subject: string
  reactComponent: React.ReactElement
}
export async function sendEmail({
  to,
  subject,
  reactComponent,
}: SendEmailParams) {
  const from = env.EMAIL_FROM
  const html = await render(reactComponent)

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  })
}

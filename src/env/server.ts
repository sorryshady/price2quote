import { createEnv } from '@t3-oss/env-nextjs'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import { z } from 'zod'

expand(config())

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production']),
    DB_HOST: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    DB_PORT: z.coerce.number(),
    DATABASE_URL: z.string().url(),
    DB_MIGRATING: z
      .string()
      .refine((s) => s === 'true' || s === 'false')
      .transform((s) => s === 'true')
      .optional(),
    AUTH_SECRET: z.string(),
    EMAIL_PROVIDER: z.enum(['nodemailer', 'resend']),
    MAILHOG_PORT: z.coerce.number(),
    MAILHOG_HOST: z.string(),
    MAILHOG_USER: z.string(),
    MAILHOG_PASSWORD: z.string(),
  },
  onValidationError: (issues) => {
    console.error(
      '❌ Invalid environment variables:',
      issues.flatMap((issue) => issue.message).join('.'),
    )
    process.exit(1)
  },
  // Called when server variables are accessed on the client.
  onInvalidAccess: (variable) => {
    console.error(
      '❌ Attempted to access a server-side environment variable on the client',
      variable,
    )
    throw new Error(
      '❌ Attempted to access a server-side environment variable on the client',
    )
  },
  emptyStringAsUndefined: true,
  // eslint-disable-next-line n/no-process-env
  experimental__runtimeEnv: process.env,
})

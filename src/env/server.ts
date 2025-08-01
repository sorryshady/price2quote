/* eslint-disable n/no-process-env */
import { createEnv } from '@t3-oss/env-nextjs'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import { z } from 'zod'

expand(config())

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production']),
    // DB_HOST: z.string(),
    // DB_USER: z.string(),
    // DB_PASSWORD: z.string(),
    // DB_NAME: z.string(),
    // DB_PORT: z.coerce.number(),
    DATABASE_URL: z.string().url(),
    DB_MIGRATING: z
      .string()
      .refine((s) => s === 'true' || s === 'false')
      .transform((s) => s === 'true')
      .optional(),
    AUTH_SECRET: z.string(),
    // MAILHOG_PORT: z.coerce.number(),
    // MAILHOG_HOST: z.string(),
    RESEND_API_KEY: z
      .string()
      .optional()
      .refine(
        (val) => process.env.NODE_ENV !== 'production' || val !== undefined,
        { message: 'RESEND_API_KEY is required in production' },
      ),
    EMAIL_FROM: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URI: z.string().url(),
    GMAIL_REDIRECT_URI: z.string().url(),
    GEMINI_API_KEY: z.string(),
    DODO_PAYMENTS_API_KEY: z.string(),
    DODO_PAYMENTS_WEBHOOK_SECRET: z.string(),
    EXCHANGERATE_API_KEY: z.string(),
    // GITHUB_CLIENT_ID: z.string(),
    // GITHUB_CLIENT_SECRET: z.string(),
    // GITHUB_REDIRECT_URI: z.string().url(),
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

  experimental__runtimeEnv: process.env,
})

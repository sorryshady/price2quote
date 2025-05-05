import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production']),
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

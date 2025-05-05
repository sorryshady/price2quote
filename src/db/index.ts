import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { env } from '@/env/server'

declare global {
  // eslint-disable-next-line no-var
  var postgresClient: ReturnType<typeof postgres> | undefined
}

const queryClient =
  global.postgresClient ?? (global.postgresClient = postgres(env.DATABASE_URL))

const db = drizzle(queryClient)

export default db

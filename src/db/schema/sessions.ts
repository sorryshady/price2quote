import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import users from './users'

const sessions = pgTable('sessions', {
  id: varchar('id', { length: 128 }).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  ip: varchar('ip', { length: 64 }),
  userAgent: varchar('user_agent', { length: 512 }),
})

export default sessions

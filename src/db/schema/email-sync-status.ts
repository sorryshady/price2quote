import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import companies from './companies'
import users from './users'

const emailSyncStatus = pgTable('email_sync_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  lastSyncAt: timestamp('last_sync_at'),
  lastMessageId: varchar('last_message_id', { length: 255 }),
  syncEnabled: boolean('sync_enabled').default(true),
  syncFrequencyMinutes: integer('sync_frequency_minutes').default(15),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export default emailSyncStatus

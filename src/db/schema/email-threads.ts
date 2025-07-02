import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import companies from './companies'
import quotes from './quotes'
import users from './users'

const emailThreads = pgTable('email_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  quoteId: uuid('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  gmailMessageId: varchar('gmail_message_id', { length: 255 }).notNull(),
  gmailThreadId: varchar('gmail_thread_id', { length: 255 }),
  to: varchar('to', { length: 255 }).notNull(),
  cc: varchar('cc', { length: 500 }),
  bcc: varchar('bcc', { length: 500 }),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  attachments: text('attachments'), // JSON array of attachment filenames
  includeQuotePdf: boolean('include_quote_pdf').default(false),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export default emailThreads

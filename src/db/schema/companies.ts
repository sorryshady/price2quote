import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import users from './users'

// Define business type enum
export const businessTypeEnum = pgEnum('business_type', [
  'freelancer',
  'company',
])

// Define AI summary status enum
export const aiSummaryStatusEnum = pgEnum('ai_summary_status', [
  'pending',
  'generating',
  'completed',
  'failed',
])

const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  businessType: businessTypeEnum('business_type').notNull(),
  logoUrl: varchar('logo_url', { length: 2048 }),
  description: text('description'),
  aiSummary: text('ai_summary'),
  aiSummaryStatus: aiSummaryStatusEnum('ai_summary_status').default('pending'),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export default companies

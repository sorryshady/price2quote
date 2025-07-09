import {
  decimal,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import companies from './companies'
import services from './services'
import users from './users'

// Define quote status enum
export const quoteStatusEnum = pgEnum('quote_status', [
  'draft',
  'awaiting_client',
  'under_revision',
  'revised',
  'accepted',
  'rejected',
  'expired',
])

// Define delivery timeline enum
export const deliveryTimelineEnum = pgEnum('delivery_timeline', [
  '1_week',
  '2_weeks',
  '1_month',
  '2_months',
  '3_months',
  'custom',
])

// Define project complexity enum
export const projectComplexityEnum = pgEnum('project_complexity', [
  'simple',
  'moderate',
  'complex',
])

const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  projectTitle: varchar('project_title', { length: 255 }).notNull(),
  projectDescription: text('project_description'),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  status: quoteStatusEnum('status').default('draft').notNull(),
  clientEmail: varchar('client_email', { length: 255 }),
  clientName: varchar('client_name', { length: 255 }),
  clientLocation: varchar('client_location', { length: 255 }),
  clientBudget: decimal('client_budget', { precision: 10, scale: 2 }),
  // New timeline and complexity fields
  deliveryTimeline: deliveryTimelineEnum('delivery_timeline')
    .default('1_month')
    .notNull(),
  customTimeline: text('custom_timeline'),
  projectComplexity: projectComplexityEnum('project_complexity')
    .default('moderate')
    .notNull(),
  quoteData: json('quote_data'),
  sentAt: timestamp('sent_at'),
  // Revision fields for quote editing system
  parentQuoteId: uuid('parent_quote_id'), // Will add foreign key constraint in migration
  revisionNotes: text('revision_notes'),
  clientFeedback: text('client_feedback'),
  versionNumber: decimal('version_number', { precision: 3, scale: 0 })
    .default('1')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Quote services junction table
const quoteServices = pgTable('quote_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteId: uuid('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  quantity: decimal('quantity', { precision: 5, scale: 2 })
    .default('1')
    .notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Quote versions table for version history
const quoteVersions = pgTable('quote_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalQuoteId: uuid('original_quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  versionNumber: decimal('version_number', {
    precision: 3,
    scale: 0,
  }).notNull(),
  revisionNotes: text('revision_notes'),
  clientFeedback: text('client_feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export default quotes
export { quoteServices, quoteVersions }

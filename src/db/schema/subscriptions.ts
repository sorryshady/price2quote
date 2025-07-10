import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import users from './users'

const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  dodoSubscriptionId: text('dodo_subscription_id').notNull().unique(),
  dodoCustomerId: text('dodo_customer_id').notNull().unique(),
  status: text('status').notNull(), // e.g., active, canceled, past_due
  currentPeriodStart: timestamp('current_period_start', {
    withTimezone: true,
  }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', {
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
export default subscriptions

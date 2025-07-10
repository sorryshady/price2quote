import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import users from './users'

const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  dodoPaymentId: text('dodo_payment_id').notNull().unique(),
  dodoSubscriptionId: text('dodo_subscription_id'),
  amount: integer('amount').notNull(), // amount in cents
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull(), // succeeded, failed, etc.
  paymentMethod: text('payment_method'), // card, etc.
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export default payments

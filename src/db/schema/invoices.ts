import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import subscriptions from './subscriptions'

const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id')
    .notNull()
    .references(() => subscriptions.id),
  dodoInvoiceId: text('dodo_invoice_id').notNull().unique(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull(), // e.g., paid, open, void
  paidAt: timestamp('paid_at', { withTimezone: true }),
  invoicePdfUrl: text('invoice_pdf_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export default invoices

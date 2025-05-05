import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core'

import users from './users'

const accounts = pgTable('account', {
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // e.g., 'credentials', 'oauth'
})

export default accounts

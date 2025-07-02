import { pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'

import companies from './companies'
import users from './users'

const gmailConnections = pgTable(
  'gmail_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    gmailEmail: varchar('gmail_email', { length: 255 }).notNull(),
    accessToken: varchar('access_token', { length: 2048 }).notNull(),
    refreshToken: varchar('refresh_token', { length: 2048 }),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userCompanyUnique: unique().on(table.userId, table.companyId),
  }),
)

export default gmailConnections

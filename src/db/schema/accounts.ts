import { pgTable, uuid } from 'drizzle-orm/pg-core'

import users from './users'

const accounts = pgTable('account', {
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export default accounts

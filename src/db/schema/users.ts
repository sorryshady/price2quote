import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 320 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }).notNull(),
  image: varchar('image', { length: 2048 }).notNull(),
})

export default users

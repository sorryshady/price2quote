import { pgTable, timestamp, uuid, varchar, pgEnum } from 'drizzle-orm/pg-core'

// Define subscription tier enum
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro'])

const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 320 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: varchar('image', { length: 2048 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('free').notNull(),
})

export default users

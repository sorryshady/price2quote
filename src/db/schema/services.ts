import { pgTable, timestamp, uuid, varchar, text, decimal, pgEnum } from 'drizzle-orm/pg-core'
import companies from './companies'

// Define skill level enum
export const skillLevelEnum = pgEnum('skill_level', ['beginner', 'intermediate', 'advanced'])

const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  skillLevel: skillLevelEnum('skill_level').notNull(),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export default services 
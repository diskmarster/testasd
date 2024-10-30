import { ErrorsPlatform } from '@/data/errors.types'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { userTable } from './auth'
import { customerTable } from './customer'

export const errorsTable = sqliteTable('nl_errors', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  userID: integer('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  customerID: integer('customer_id')
    .notNull()
    .references(() => customerTable.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull().$type<ErrorsPlatform>(),
  inserted: integer('inserted', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  input: text('input', { mode: 'json' }).notNull().$type<unknown>(),
  error: text('error', { mode: 'json' }).notNull().default(''),
  origin: text('origin').notNull(),
})

export type ApplicationError = typeof errorsTable.$inferSelect
export type ApplicationErrorID = ApplicationError['id']
export type NewApplicationError = typeof errorsTable.$inferInsert

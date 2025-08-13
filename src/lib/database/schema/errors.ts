import { ErrorsCategory } from '@/data/errors.types'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const errorsTable = sqliteTable('nl_errors', {
	id: integer('id').notNull().primaryKey({ autoIncrement: true }),
	userID: integer('user_id').notNull(),
	customerID: integer('customer_id').notNull(),
	type: text('type').notNull().$type<ErrorsCategory>(),
	inserted: integer('inserted', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	input: text('input', { mode: 'json' }),
	error: text('error').notNull().default(''),
	origin: text('origin').notNull(),
})

export type ApplicationError = typeof errorsTable.$inferSelect
export type ApplicationErrorID = ApplicationError['id']
export type NewApplicationError = typeof errorsTable.$inferInsert

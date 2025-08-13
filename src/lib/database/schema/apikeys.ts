import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { customerTable } from './customer'

export const apikeysTable = sqliteTable(
	'nl_apikeys',
	{
		key: text('key').primaryKey(),
		hash: text('hash').notNull(),
		name: text('name').notNull(),
		customerID: integer('customer_id')
			.notNull()
			.references(() => customerTable.id, { onDelete: 'cascade' }),
		expiry: integer('expiry', { mode: 'timestamp' })
			.$type<Date | null>()
			.default(null),
	},
	t => [unique('unq_name_customer').on(t.name, t.customerID)],
)

export type ApiKey = typeof apikeysTable.$inferSelect
export type NewApiKey = typeof apikeysTable.$inferInsert

import { IntegrationLogStatus } from '@/data/integrations.types'
import {
	SyncProviderEvent,
	SyncProviderType,
} from '@/lib/integrations/sync/interfaces'
import { sql } from 'drizzle-orm'
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
	unique,
} from 'drizzle-orm/sqlite-core'
import { customerTable } from './customer'

export const customerIntegrations = sqliteTable(
	'nl_customer_integrations',
	{
		id: integer('id').notNull().primaryKey({ autoIncrement: true }),
		customerID: integer('customer_id')
			.notNull()
			.references(() => customerTable.id, { onDelete: 'cascade' }),
		provider: text('provider').notNull().$type<SyncProviderType>(),
		config: text('config', { mode: 'json' }).notNull(),
	},
	t => [unique('unq_provider_customer_id').on(t.provider, t.customerID)],
)

export type CustomerIntegration = typeof customerIntegrations.$inferSelect
export type NewCustomerIntegration = typeof customerIntegrations.$inferInsert
export type CustomerIntegrationID = CustomerIntegration['id']

export const customerIntegrationSettings = sqliteTable(
	'nl_customer_integration_settings',
	{
		id: integer('id').notNull().primaryKey({ autoIncrement: true }),
		integrationID: integer('integration_id')
			.notNull()
			.unique()
			.references(() => customerIntegrations.id, { onDelete: 'cascade' }),
		customerID: integer('customer_id')
			.notNull()
			.references(() => customerTable.id)
			.unique(),
		useSyncProducts: integer('use_sync_products', { mode: 'boolean' })
			.notNull()
			.default(false),
		useSyncSuppliers: integer('use_sync_suppliers', { mode: 'boolean' })
			.notNull()
			.default(false),
		lambaUploaded: integer('lamba_uploaded', { mode: 'boolean' })
			.notNull()
			.default(false),
	},
)

export type CustomerIntegrationSettings =
	typeof customerIntegrationSettings.$inferSelect
export type NewCustomerIntegrationSettings =
	typeof customerIntegrationSettings.$inferInsert

export const fullSyncCronConfigs = sqliteTable(
	'nl_full_sync_cron_configs',
	{
		integrationID: integer('integration_id')
			.notNull()
			.references(() => customerIntegrations.id, { onDelete: 'cascade' }),
		customerID: integer('customer_id')
			.notNull()
			.references(() => customerTable.id),
		functionName: text('function_name').notNull().unique(),
		functionARN: text('function_arn').notNull().unique(),
		scheduleName: text('schedule_name').notNull().unique(),
		scheduleARN: text('schedule_arn').notNull().unique(),
		inserted: integer('inserted', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updated: integer('updated', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
			.$onUpdateFn(() => new Date())
			.$type<Date>(),
	},
	t => [primaryKey({ columns: [t.customerID, t.integrationID] })],
)

export type FullSyncCronConfig = typeof fullSyncCronConfigs.$inferSelect
export type NewFullSyncCronConfig = typeof fullSyncCronConfigs.$inferInsert
/** Tuple of first: IntegrationID and second: CustomerID */
export type FullSyncCronConfigID = [
	FullSyncCronConfig['integrationID'],
	FullSyncCronConfig['customerID'],
]

export const integrationLogs = sqliteTable('nl_integration_logs', {
	id: integer('id').notNull().primaryKey({ autoIncrement: true }),
	integrationID: integer('integration_id')
		.notNull()
		.references(() => customerIntegrations.id, { onDelete: 'cascade' }),
	customerID: integer('customer_id')
		.notNull()
		.references(() => customerTable.id),
	status: text('status').notNull().$type<IntegrationLogStatus>(),
	message: text('message').notNull(),
	event: text('event', { mode: 'json' }).notNull().$type<SyncProviderEvent>(),
	inserted: integer('inserted', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updated: integer('updated', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdateFn(() => new Date())
		.$type<Date>(),
})

export type IntegrationLog = typeof integrationLogs.$inferSelect
export type NewIntegrationLog = typeof integrationLogs.$inferInsert

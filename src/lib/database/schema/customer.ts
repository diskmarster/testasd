import { Plan } from '@/data/customer.types'
import { UserRole } from '@/data/user.types'
import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { userTable } from './auth'
import { RegulationType } from '@/data/inventory.types'

export const customerTable = sqliteTable('nl_customer', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  plan: text('plan').notNull().$type<Plan>(),
  extraUsers: integer('extra_users').notNull().default(0),
  company: text('company').notNull(),
  email: text('email').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  inserted: integer('inserted', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date())
    .$type<Date>(),
})

export type NewCustomer = typeof customerTable.$inferInsert
export type Customer = typeof customerTable.$inferSelect
export type CustomerID = Customer['id']
export type PartialCustomer = Partial<Customer>
export type CustomerWithSettings = Customer & { settings: CustomerSettings }

export const customerLinkTable = sqliteTable('nl_customer_link', {
  id: text('id').notNull().primaryKey(),
  customerID: integer('customer_id')
    .notNull()
    .references(() => customerTable.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().$type<UserRole>(),
  locationID: text('location_id')
    .notNull()
    .references(() => locationTable.id, { onDelete: 'cascade' }),
  inserted: integer('inserted', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type NewCustomerLink = typeof customerLinkTable.$inferInsert
export type CustomerLink = typeof customerLinkTable.$inferSelect
export type CustomerLinkID = CustomerLink['id']
export type PartialCustomerLink = Partial<CustomerLink>

export const locationTable = sqliteTable(
  'nl_location',
  {
    id: text('id').notNull().primaryKey(),
    customerID: integer('customer_id')
      .notNull()
      .references(() => customerTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    isBarred: integer('is_barred', { mode: 'boolean' })
      .notNull()
      .default(false),
    inserted: integer('inserted', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updated: integer('updated', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdateFn(() => new Date())
      .$type<Date>(),
  },
  t => [
    unique().on(t.name, t.customerID),
  ],
)

export type NewLocation = typeof locationTable.$inferInsert
export type Location = typeof locationTable.$inferSelect
export type LocationID = Location['id']
export type PartialLocation = Partial<Location>
export type LocationWithPrimary = Location & { isPrimary: boolean }

export const linkLocationToUserTable = sqliteTable(
  'nl_link_location_to_user',
  {
    locationID: text('location_id')
      .notNull()
      .references(() => locationTable.id, { onDelete: 'cascade' }),
    userID: integer('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    customerID: integer('customer_id')
      .notNull()
      .references(() => customerTable.id, { onDelete: 'cascade' }),
    isPrimary: integer('is_primary', { mode: 'boolean' })
      .notNull()
      .default(false),
  },
  table => [
    primaryKey({ columns: [table.userID, table.locationID] }),
  ],
)

export type NewLinkLocationToUser = typeof linkLocationToUserTable.$inferInsert
export type LinkLocationToUser = typeof linkLocationToUserTable.$inferSelect
export type LinkLocationToUserPK = {
  userID: LinkLocationToUser['userID']
  locationID: LinkLocationToUser['locationID']
}
export type PartialLinkLocationToUser = Partial<LinkLocationToUser>

export const customerSettingsTable = sqliteTable('nl_customer_settings', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  customerID: integer('customer_id')
    .notNull()
    .references(() => customerTable.id, { onDelete: 'cascade' }),
  useReference: text('use_reference', { mode: 'json' })
    .notNull()
		.default({
			tilgang: true,
			afgang: true,
			regulering: true,
			flyt: true,
		})
		.$type<UseReferenceSetting>(),
  usePlacement: integer('use_placement', { mode: 'boolean' })
    .notNull()
    .default(true),
  useBatch: integer('use_batch', { mode: 'boolean' }).notNull().default(true),
  inserted: integer('inserted', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date())
    .$type<Date>(),
})

export type NewCustomerSettings = typeof customerSettingsTable.$inferInsert
export type CustomerSettings = typeof customerSettingsTable.$inferSelect
export type CustomerSettingsID = CustomerSettings['id']
export type PartialCustomerSettings = Partial<CustomerSettings>
export type UseReferenceSetting = {
	[Property in RegulationType]: boolean
}

export const customerMailSettingsTable = sqliteTable(
  'nl_customer_mail_settings',
  {
    id: integer('id').notNull().primaryKey({ autoIncrement: true }),
    customerID: integer('customer_id')
      .notNull()
      .references(() => customerTable.id, { onDelete: 'cascade' }),
    locationID: text('location_id')
      .notNull()
      .references(() => locationTable.id, { onDelete: 'cascade' }),
    userID: integer('user_id').references(() => userTable.id, {
      onDelete: 'cascade',
    }),
    email: text('email'),
    sendStockMail: integer('send_stock_mail', { mode: 'boolean' }).default(
      false,
    ),
    sendReorderMail: integer('send_reorder_mail', { mode: 'boolean' }).default(
      false,
    ),
    sendMovementsMail: integer('send_movements_mail', { mode: 'boolean' }).default(
      false,
    ),
    inserted: integer('inserted', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updated: integer('updated', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdateFn(() => new Date())
      .$type<Date>(),
  },
  t => [
    check(
      'email_check',
      sql`(${t.userID} IS NULL AND ${t.email} IS NOT NULL) OR (${t.userID} IS NOT NULL AND ${t.email} IS NULL)`,
    ),
		// this will give you a starting point in your migration files but the expression will get escaped incorrectly
		// see: https://github.com/drizzle-team/drizzle-orm/issues/3350
		// needs to be like this in migration files:
		// CREATE UNIQUE INDEX `unq` ON `nl_customer_mail_settings` (`customer_id`,`location_id`,ifnull(`user_id`, 0),ifnull(`email`, 0));
		uniqueIndex('unq').on(t.customerID, t.locationID, sql`ifnull(${t.userID}, 0)`, sql`ifnull(${t.email}, 0)`),
  ],
)

export type CustomerMailSetting = typeof customerMailSettingsTable.$inferSelect
export type NewCustomerMailSetting =
  typeof customerMailSettingsTable.$inferInsert
export type CustomerMailSettingID = CustomerMailSetting['id']

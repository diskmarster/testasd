import { SupplierContry, SupplierHistoryType } from '@/data/suppliers.types'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { customerTable } from './customer'

export const supplierTable = sqliteTable('nl_suppliers', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  customerID: integer('customer_id')
    .notNull()
    .references(() => customerTable.id, { onDelete: 'cascade' }),
  inserted: integer('inserted', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date())
    .$type<Date>(),
  userID: integer('user_id').notNull(),
  userName: text('user_name').notNull(),
  name: text('name').notNull(),
  idOfClient: text('id_of_client').notNull().default(''),
  country: text('country').$type<SupplierContry>().notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  contactPerson: text('contact_person').notNull().default(''),
})

export type Supplier = typeof supplierTable.$inferSelect
export type NewSupplier = typeof supplierTable.$inferInsert
export type SupplierID = Supplier['id']

export const supplierHistoryTable = sqliteTable('nl_suppliers_history', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  type: text('type').$type<SupplierHistoryType>().notNull(),
  supplierID: integer('supplier_id').notNull(),
  customerID: integer('customer_id')
    .notNull()
    .references(() => customerTable.id, { onDelete: 'cascade' }),
  inserted: integer('inserted', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  userID: integer('user_id').notNull(),
  userName: text('name').notNull(),
  name: text('name').notNull(),
  idOfClient: text('id_of_client').notNull().default(''),
  country: text('country').notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  contactPerson: text('contact_person').notNull().default(''),
})

export type SupplierHisotry = typeof supplierHistoryTable.$inferSelect
export type NewSupplierHistory = typeof supplierHistoryTable.$inferInsert
export type SupplierHistoryID = SupplierHisotry['id']

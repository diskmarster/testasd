import { sql } from 'drizzle-orm'
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { customerTable, locationTable } from './customer'
import { productTable } from './inventory'

export const reorderTable = sqliteTable(
  'nl_reorder',
  {
    locationID: text('location_id')
      .notNull()
      .references(() => locationTable.id, { onDelete: 'cascade' }),
    productID: integer('product_id')
      .notNull()
      .references(() => productTable.id, { onDelete: 'cascade' }),
    customerID: integer('customer_id')
      .notNull()
      .references(() => customerTable.id, { onDelete: 'cascade' }),
    minimum: real('minimum').notNull(),
    ordered: real('ordered').notNull().default(0),
    inserted: integer('inserted', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updated: integer('updated', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdateFn(() => new Date())
      .$type<Date>(),
    orderAmount: real('order_amount').notNull().default(0),
    maxOrderAmount: real('max_order_amount').notNull().default(0),
		isRequested: integer('is_requested', {mode: 'boolean'}).notNull().default(false)
  },
  t => ({
    pk: primaryKey({
      columns: [t.productID, t.locationID, t.customerID],
    }),
  }),
)

export type Reorder = typeof reorderTable.$inferSelect
export type NewReorder = typeof reorderTable.$inferInsert
export type PartialReorder = Partial<Reorder>

export const ordersTable = sqliteTable('nl_orders', {
  id: text('id').notNull().primaryKey(),
  userID: integer('user_id').notNull(),
  userName: text('user_name').notNull(),
  locationID: text('location_id')
    .notNull()
    .references(() => locationTable.id),
  customerID: integer('customer_id')
    .notNull()
    .references(() => customerTable.id),
  inserted: integer('inserted', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date())
    .$type<Date>(),
})

export type Order = typeof ordersTable.$inferSelect
export type OrderID = Order['id']
export type NewOrder = typeof ordersTable.$inferInsert

export const orderLinesTable = sqliteTable('nl_order_lines', {
  orderID: text('order_id')
    .notNull()
    .references(() => ordersTable.id, {
      onDelete: 'cascade',
    }),
  locationID: text('location_id')
    .notNull()
    .references(() => locationTable.id),
  customerID: integer('customer_id')
    .notNull()
    .references(() => customerTable.id),
  productID: integer('product_id')
    .notNull()
    .references(() => productTable.id, {
      onDelete: 'cascade',
    }),
	supplierName: text('supplier').notNull(),
	sku: text('sku').notNull(),
	barcode: text('barcode').notNull(),
	text1: text('text1').notNull(),
	text2: text('text2').notNull(),
	unitName: text('unit_name').notNull(),
	costPrice: real('cost_price').notNull(),
  quantity: real('quantity').notNull(),
  sum: real('sum').notNull(),
})

export type OrderLine = typeof orderLinesTable.$inferSelect
export type NewOrderLine = typeof orderLinesTable.$inferInsert

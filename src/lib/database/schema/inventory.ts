import { integer, primaryKey, real, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { customerTable, locationTable } from "@/lib/database/schema/customer";
import { sql } from "drizzle-orm";
import { HistoryType } from "@/data/inventory.types";

export const unitTable = sqliteTable('nl_unit', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  inserted: integer('inserted', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdateFn(() => new Date()).$type<Date>(),
  isBarred: integer('is_barred', { mode: 'boolean' }).notNull().default(false)
})

export type Unit = typeof unitTable.$inferSelect
export type NewUnit = typeof unitTable.$inferSelect
export type PartialUnit = Partial<Unit>
export type UnitID = Unit['id']

export const placementTable = sqliteTable('nl_placement', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  locationID: text('location_id').notNull().references(() => locationTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  inserted: integer('inserted', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdateFn(() => new Date()).$type<Date>(),
  isBarred: integer('is_barred', { mode: 'boolean' }).notNull().default(false)
}, (t) => ({
  unq: unique().on(t.locationID, t.name),
}))

export type Placement = typeof placementTable.$inferSelect
export type NewPlacement = typeof placementTable.$inferSelect
export type PartialPlacement = Partial<Placement>
export type PlacementID = Placement['id']

export const batchTable = sqliteTable('nl_batch', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  locationID: text('location_id').notNull().references(() => locationTable.id, { onDelete: 'cascade' }),
  batch: text('batch').notNull(),
  expiry: integer('expiry', { mode: 'timestamp' }),
  inserted: integer('inserted', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdateFn(() => new Date()).$type<Date>(),
  isBarred: integer('is_barred', { mode: 'boolean' }).notNull().default(false)
}, (t) => ({
  unq: unique().on(t.locationID, t.batch)
}))

export type Batch = typeof batchTable.$inferSelect
export type NewBatch = typeof batchTable.$inferSelect
export type PartialBatch = Partial<Batch>
export type BatchID = Batch['id']

export const groupTable = sqliteTable('nl_group', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  customerID: integer('customer_id').notNull().references(() => customerTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  inserted: integer('inserted', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdateFn(() => new Date()).$type<Date>(),
  isBarred: integer('is_barred', { mode: 'boolean' }).notNull().default(false)
}, (t) => ({
  unq: unique().on(t.customerID, t.name)
}))

export type Group = typeof groupTable.$inferSelect
export type NewGroup = typeof groupTable.$inferSelect
export type PartialGroup = Partial<Group>
export type GroupID = Group['id']

export const productTable = sqliteTable('nl_product', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  customerID: integer('customer_id').notNull().references(() => customerTable.id, { onDelete: 'cascade' }),
  groupID: integer('group_id').notNull().references(() => groupTable.id),
  unitID: integer('unit_id').notNull().references(() => unitTable.id),
  text1: text('text_1').notNull(),
  text2: text('text_2').notNull().default(''),
  text3: text('text_3').notNull().default(''),
  sku: text('sku').notNull(),
  barcode: text('barcode').notNull(),
  costPrice: real('cost_price').notNull(),
  salesPrice: real('sales_price').notNull().default(0),
  inserted: integer('inserted', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdateFn(() => new Date()).$type<Date>(),
  isBarred: integer('is_barred', { mode: 'boolean' }).notNull().default(false)
}, (t) => ({
  unqSku: unique().on(t.customerID, t.sku),
  unqBarcode: unique().on(t.customerID, t.barcode)
}))

export type Product = typeof productTable.$inferSelect
export type NewProduct = typeof productTable.$inferSelect
export type PartialProduct = Partial<Product>
export type ProductID = Product['id']

export const inventoryTable = sqliteTable('nl_inventory', {
  productID: integer('product_id').notNull().references(() => productTable.id, { onDelete: 'cascade' }),
  placementID: integer('placement_id').notNull().references(() => placementTable.id),
  batchID: integer('batch_id').notNull().references(() => batchTable.id),
  locationID: text('location_id').notNull().references(() => locationTable.id),
  customerID: integer('customer_id').notNull().references(() => customerTable.id),
  quantity: real('quantity').notNull().default(0),
  inserted: integer('inserted', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdateFn(() => new Date()).$type<Date>(),
}, (t) => ({
  pk: primaryKey({ columns: [t.productID, t.placementID, t.batchID, t.locationID, t.customerID] })
}))

export type Inventory = typeof inventoryTable.$inferSelect
export type NewInventory = typeof inventoryTable.$inferSelect
export type PartialInventory = Partial<Inventory>

export const historyTable = sqliteTable('nl_history', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  userID: integer('user_id').notNull(),
  customerID: integer('customer_id').notNull().references(() => customerTable.id, { onDelete: 'cascade' }),
  locationID: integer('location_id').notNull().references(() => locationTable.id, { onDelete: 'cascade' }),
  productID: integer('product_id').notNull(),
  placementID: integer('placement_id').notNull(),
  batchID: integer('batch_id').notNull(),
  type: text('type').notNull().$type<HistoryType>(),
  amount: real('amount').notNull(),
  reference: text('reference').notNull().default(''),
  inserted: integer('inserted', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export type History = typeof historyTable.$inferSelect
export type NewHistory = typeof historyTable.$inferSelect
export type PartialHistory = Partial<History>
export type HistoryID = History['id']

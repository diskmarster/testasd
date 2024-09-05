import { Plan } from "@/data/customer.types";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { userTable } from "./auth";
import { UserRole } from "@/data/user.types";

export const customerTable = sqliteTable("nl_customer", {
  id: integer("id").notNull().primaryKey({ autoIncrement: true }),
  plan: text("plan").notNull().$type<Plan>(),
  company: text("company").notNull(),
  email: text("email").notNull().unique(),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(false),
  inserted: integer("inserted", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updated: integer("updated", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdateFn(() => new Date()).$type<Date>()
})

export type NewCustomer = typeof customerTable.$inferInsert
export type Customer = typeof customerTable.$inferSelect
export type CustomerID = Customer['id']
export type PartialCustomer = Partial<Customer>

export const customerLinkTable = sqliteTable('nl_customer_link', {
  id: text("id").notNull().primaryKey(),
  customerID: integer('customer_id').notNull().references(() => customerTable.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().$type<UserRole>(),
  locationID: text('location_id').notNull().references(() => locationTable.id, { onDelete: 'cascade' }),
  inserted: integer("inserted", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export type NewCustomerLink = typeof customerLinkTable.$inferInsert
export type CustomerLink = typeof customerLinkTable.$inferSelect
export type CustomerLinkID = CustomerLink['id']
export type PartialCustomerLink = Partial<CustomerLink>

export const locationTable = sqliteTable('nl_location', {
  id: text("id").notNull().primaryKey(),
  customerID: integer('customer_id').notNull().references(() => customerTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull()
})

export type NewLocation = typeof locationTable.$inferInsert
export type Location = typeof locationTable.$inferSelect
export type LocationID = Location['id']
export type PartialLocation = Partial<Location>
export type LocationWithPrimary = Location & { isPrimary: boolean }

export const linkLocationToUserTable = sqliteTable('nl_link_location_to_user', {
  locationID: text('location_id').notNull().references(() => locationTable.id, { onDelete: 'cascade' }),
  userID: integer('user_id').notNull().references(() => userTable.id, { onDelete: 'cascade' }),
  customerID: integer('customer_id').notNull().references(() => customerTable.id, { onDelete: 'cascade' }),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false)
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userID, table.locationID] }),
  }
})

export type NewLinkLocationToUser = typeof linkLocationToUserTable.$inferInsert
export type LinkLocationToUser = typeof linkLocationToUserTable.$inferSelect
export type LinkLocationToUserPK = { userID: LinkLocationToUser['userID'], locationID: LinkLocationToUser['locationID'] }
export type PartialLinkLocationToUser = Partial<LinkLocationToUser>

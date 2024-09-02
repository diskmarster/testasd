import { Plan } from "@/data/customer.types";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  inserted: integer("inserted", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export type NewCustomerLink = typeof customerLinkTable.$inferInsert
export type CustomerLink = typeof customerLinkTable.$inferSelect
export type CustomerLinkID = CustomerLink['id']
export type PartialCustomerLink = Partial<CustomerLink>

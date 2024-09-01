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

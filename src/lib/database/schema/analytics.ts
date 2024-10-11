import { integer, text, sqliteTable, real } from "drizzle-orm/sqlite-core";
import { userTable } from "./auth";
import { customerTable } from "./customer";
import { sql } from "drizzle-orm";

export const actionAnalyticsTable = sqliteTable('nl_action_analytics', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  actionName: text('actionName').notNull(),
  userID: integer('user_id').notNull().references(() => userTable.id, { onDelete: 'cascade' }),
  customerID: integer('customer_id').notNull().references(() => customerTable.id, { onDelete: 'cascade' }),
  executionTime: real('execution_time').notNull(),
  inserted: integer("inserted", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

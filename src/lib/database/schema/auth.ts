import { UserRole } from "@/data/user.types";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { customerTable } from "@/lib/database/schema/customer";

export const userTable = sqliteTable("nl_user", {
  id: integer("id").notNull().primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  hash: text("hash").notNull(),
  role: text("role").$type<UserRole>().notNull().default('bruger'),
  clientID: integer("client_id").notNull().references(() => customerTable.id, { onDelete: 'cascade' }),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(false),
  inserted: integer("inserted", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updated: integer("updated", { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdateFn(() => new Date()).$type<Date>()
})

export type User = typeof userTable.$inferSelect
export type NewUser = typeof userTable.$inferInsert
export type PartialUser = Partial<User>
export type UserNoHash = Omit<User, 'hash'>

export const sessionTable = sqliteTable("nl_session", {
  id: text("id").notNull().primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  expiresAt: integer("expires_at").notNull()
});


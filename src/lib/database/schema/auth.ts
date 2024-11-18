import {
  AuthProviderDomain,
  ResetPasswordType,
  UserRole,
} from '@/data/user.types'
import { customerTable, LocationID } from '@/lib/database/schema/customer'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

export const userTable = sqliteTable('nl_user', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').$type<UserRole>().notNull().default('bruger'),
  customerID: integer('customer_id')
    .notNull()
    .references(() => customerTable.id, { onDelete: 'cascade' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  inserted: integer('inserted', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updated: integer('updated', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date())
    .$type<Date>(),
  webAccess: integer('web_access', { mode: 'boolean' }).notNull().default(true),
  appAccess: integer('app_access', { mode: 'boolean' }).notNull().default(true),
  priceAccess: integer('price_access', { mode: 'boolean' })
    .notNull()
    .default(true),
})

export type User = typeof userTable.$inferSelect
export type UserID = User['id']
export type NewUser = typeof userTable.$inferInsert & { hash: string, pin: string}
export type PartialUser = Partial<User>
export type UserNoHash = Omit<User, 'hash' | 'pin'>
export type UserWithAuth<TAuthDomain extends AuthProviderDomain> = User & GenericAuthProvider<TAuthDomain>

export const sessionTable = sqliteTable('nl_session', {
  id: text('id').notNull().primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
})

export const resetPasswordTable = sqliteTable('nl_reset_password', {
  id: text('id').notNull().primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
  passwordType: text('password_type')
    .$type<ResetPasswordType>()
    .notNull()
    .default('pw'),
})

export type ResetPassword = typeof resetPasswordTable.$inferSelect
export type ResetPasswordID = ResetPassword['id']

export const userLinkTable = sqliteTable('nl_user_link', {
  id: text('id').notNull().primaryKey(),
  customerID: integer('customer_id')
    .notNull()
    .references(() => customerTable.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().$type<UserRole>(),
  locationIDs: text('location_ids').notNull().$type<LocationID[]>(),
  inserted: integer('inserted', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  webAccess: integer('web_access', { mode: 'boolean' }).notNull().default(true),
  appAccess: integer('app_access', { mode: 'boolean' }).notNull().default(true),
  priceAccess: integer('price_access', { mode: 'boolean' })
    .notNull()
    .default(true),
})

export type UserLink = typeof userLinkTable.$inferSelect
export type UserLinkID = UserLink['id']
export type NewUserLink = typeof userLinkTable.$inferInsert

export const authProviderTable = sqliteTable(
  'nl_auth_provider',
  {
    id: integer('id').notNull().primaryKey({ autoIncrement: true }),
    userID: integer('user_id')
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    authID: text('auth_id').notNull(),
    domain: text('domain').$type<AuthProviderDomain>().notNull(),
    inserted: integer('inserted', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$type<Date>(),
    updated: integer('updated', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdateFn(() => new Date())
      .$type<Date>(),
  },
  t => ({
    unq: unique().on(t.domain, t.userID),
    authIDUnq: unique().on(t.authID),
  }),
)

export type AuthProvider = typeof authProviderTable.$inferSelect
export type AuthProviderID = AuthProvider['id']
export type NewAuthProvider = typeof authProviderTable.$inferInsert
export interface GenericAuthProvider<TDomain extends AuthProviderDomain> extends AuthProvider {
  domain: TDomain 
}

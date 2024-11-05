import { AnalyticsPlatform } from '@/data/analytics.types'
import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { userTable } from './auth'
import { customerTable } from './customer'

export const actionAnalyticsTable = sqliteTable('nl_action_analytics', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  actionName: text('actionName').notNull(),
  userID: integer('user_id')
    .notNull()
    .references(() => userTable.id, { onDelete: 'cascade' }),
  customerID: integer('customer_id')
    .notNull()
    .references(() => customerTable.id, { onDelete: 'cascade' }),
  sessionID: text('session_id'),
  executionTimeMS: real('execution_time_ms').notNull(),
  platform: text('platform').notNull().$type<AnalyticsPlatform>(),
  inserted: integer('inserted', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type ActionAnalytic = typeof actionAnalyticsTable.$inferSelect
export type ActionAnalyticID = ActionAnalytic['id']
export type NewActionAnalytic = typeof actionAnalyticsTable.$inferInsert

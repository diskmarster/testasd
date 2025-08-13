import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'

export const announcementTypesSchema = z.enum([
	'info',
	'warning',
	'success',
	'error',
])
export type AnnouncementType = z.infer<typeof announcementTypesSchema>

export const announcementTable = sqliteTable('nl_announcement', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	type: text('type').$type<AnnouncementType>().notNull(),
	message: text('message').notNull(),
	active: integer('active', { mode: 'boolean' }).notNull().default(false),
	activeUntil: integer('active_until', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch() + 86400)`),
})

export type Announcement = typeof announcementTable.$inferSelect
export type NewAnnountment = typeof announcementTable.$inferInsert

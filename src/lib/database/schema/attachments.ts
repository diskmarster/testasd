import { RefType } from '@/data/attachments'
import { AttachmentType } from '@/service/file'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { customerTable } from './customer'

export const attachmentsTable = sqliteTable('nl_attachments', {
	id: integer('id').notNull().primaryKey({ autoIncrement: true }),
	customerID: integer('customer_id')
		.notNull()
		.references(() => customerTable.id, { onDelete: 'cascade' }),
	refDomain: text('ref_domain').$type<RefType>().notNull(),
	type: text('type').$type<AttachmentType>().notNull(),
	refID: text('ref_id').notNull(),
	key: text('key').notNull(),
	name: text('name').notNull(),
	url: text('url').notNull(),
	inserted: integer('inserted', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	userID: integer('user_id').notNull(),
	userName: text('user_name').notNull(),
})

export type Attachment = typeof attachmentsTable.$inferSelect
export type AttachmentID = Attachment['id']
export type NewAttachment = typeof attachmentsTable.$inferInsert

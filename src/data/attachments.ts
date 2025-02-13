import { db, TRX } from '@/lib/database'
import {
  Attachment,
  AttachmentID,
  attachmentsTable,
  NewAttachment,
} from '@/lib/database/schema/attachments'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'

export const attachmentRefTypeValidation = z.enum(['product'])
export type RefType = z.infer<typeof attachmentRefTypeValidation>

export const attachments = {
  create: async function (
    a: NewAttachment,
    tx: TRX = db,
  ): Promise<Attachment | undefined> {
    const attachment = await tx.insert(attachmentsTable).values(a).returning()
    return attachment[0]
  },
  deleteByID: async function (
    ID: AttachmentID,
    tx: TRX = db,
  ): Promise<boolean> {
    const res = await tx
      .delete(attachmentsTable)
      .where(eq(attachmentsTable.id, ID))
    return res.rowsAffected == 1
  },
  getByID: async function (
    domain: RefType,
    id: number,
    tx: TRX = db,
  ): Promise<Attachment[]> {
    return await tx
      .select()
      .from(attachmentsTable)
      .where(
        and(
          eq(attachmentsTable.refDomain, domain),
          eq(attachmentsTable.refID, id),
        ),
      )
      .orderBy(asc(attachmentsTable.id))
  },
}

import { attachments, RefType } from '@/data/attachments'
import {
  Attachment,
  AttachmentID,
  NewAttachment,
} from '@/lib/database/schema/attachments'

export const attachmentService = {
  create: async function (a: NewAttachment): Promise<Attachment | undefined> {
    return await attachments.create(a)
  },
  deleteByID: async function (ID: AttachmentID): Promise<boolean> {
    return await attachments.deleteByID(ID)
  },
  getByID: async function (domain: RefType, id: number): Promise<Attachment[]> {
    return await attachments.getByID(domain, id)
  },
}

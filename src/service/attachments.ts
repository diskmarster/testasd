import { attachments, RefType } from '@/data/attachments'
import {
  Attachment,
  AttachmentID,
  NewAttachment,
} from '@/lib/database/schema/attachments'
import { CustomerID } from '@/lib/database/schema/customer'
import { AttachmentType } from './file'

export const attachmentService = {
  create: async function (a: NewAttachment): Promise<Attachment | undefined> {
    return await attachments.create(a)
  },
  deleteByID: async function (ID: AttachmentID): Promise<boolean> {
    return await attachments.deleteByID(ID)
  },
  getByRefID: async function (
    domain: RefType,
    id: number | string,
  ): Promise<Attachment[]> {
    return await attachments.getByRefID(domain, id)
  },
  getByID: async function (id: number): Promise<Attachment | undefined> {
    return await attachments.getByID(id)
  },
  getByCustomerID: async function(
	  customerID: CustomerID,
	  domain?: RefType,
	  type?: AttachmentType,
  ): Promise<Attachment[]> {
	  return attachments.getByCustomerID(customerID, domain, type)
  }
}

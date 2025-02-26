'use server'

import { serverTranslation } from '@/app/i18n'
import { attachmentRefTypeValidation } from '@/data/attachments'
import { adminAction, editableAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { attachmentService } from '@/service/attachments'
import { fileService } from '@/service/file'
import { inventoryService } from '@/service/inventory'
import { productService } from '@/service/products'
import { suppliersService } from '@/service/suppliers'
import { z } from 'zod'

const createAttachmentValidation = z.object({
  name: z.string(),
  refType: attachmentRefTypeValidation,
  refID: z.coerce.number(),
  type: z.enum(['image', 'pdf']),
  key: z.string(),
  url: z.string(),
})

const deleteAttachmentValidation = z.object({
  id: z.coerce.number(),
})

const uploadFileValidation = z.object({
  key: z.string(),
  type: z.string(),
  body: z.string(),
})

export const uploadFileAction = adminAction
  .schema(uploadFileValidation)
  .action(async ({ parsedInput: { key, type, body } }) => {
    const b = Buffer.from(body, 'base64url')
    const arraybuffer = new Uint8Array(b)

    return await fileService.upload({ key, mimeType: type, body: arraybuffer })
  })

export const createAttachmentAction = adminAction
  .schema(createAttachmentValidation)
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'produkter')

    const newAttachment = await attachmentService.create({
      customerID: ctx.user.customerID,
      refDomain: parsedInput.refType,
      refID: parsedInput.refID,
      name: parsedInput.name,
      type: parsedInput.type,
      key: parsedInput.key,
      url: parsedInput.url,
      userID: ctx.user.id,
      userName: ctx.user.name,
    })

    if (!newAttachment) {
      throw new ActionError(t('details-page.server.attachment-not-created'))
    }

    return {
      success: true,
      attachment: newAttachment,
    }
  })

export const deleteAttachmentAction = adminAction
  .schema(deleteAttachmentValidation)
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'produkter')
    const didDelete = await attachmentService.deleteByID(parsedInput.id)
    if (!didDelete) {
      throw new ActionError(t('details-page.server.file-not-deleted'))
    }
  })

export const deleteAttachmentAndFileAction = editableAction
  .schema(z.object({ id: z.coerce.number() }))
  .action(async ({ parsedInput: { id }, ctx: { user, lang } }) => {
    const { t } = await serverTranslation(lang, 'produkter')
    const attachment = await attachmentService.getByID(id)
    if (!attachment) {
      throw new ActionError(t('details-page.server.file-not-found'))
    }

    if (attachment.customerID != user.customerID) {
      throw new ActionError(t('details-page.server.file-not-yours'))
    }

    const s3DeletePromise = fileService.delete({ key: attachment.key })
    const attachmentDeletePromise = attachmentService.deleteByID(id)

    const [s3Delete, attachDelete] = await Promise.all([
      s3DeletePromise,
      attachmentDeletePromise,
    ])

    if (s3Delete.success && !attachDelete) {
      throw new ActionError(t('details-page.server.file-not-deleted-database'))
    }

    if (!s3Delete.success && attachDelete) {
      throw new ActionError(t('details-page.server.file-not-deleted-bucket'))
    }

    if (!s3Delete.success && !attachDelete) {
      throw new ActionError(t('details-page.server.file-not-deleted-both'))
    }
  })

export const fetchActiveUnitsAction = editableAction.action(async () => {
  const units = await inventoryService.getActiveUnits()
  return units
})

export const fetchActiveGroupsAction = editableAction.action(
  async ({ ctx: { user } }) => {
    const groups = await inventoryService.getActiveGroupsByID(user.customerID)
    return groups
  },
)

export const fetchProductHistory = editableAction
  .schema(z.object({ id: z.coerce.number() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const history = await productService.getHistoryLogs(user.customerID, id)
    return history
  })

export const fetchProductFiles = editableAction
  .schema(z.object({ id: z.coerce.number() }))
  .action(async ({ parsedInput: { id } }) => {
    const files = await attachmentService.getByRefID('product', id)
    return files
  })

export const fetchSuppliersAction = editableAction.action(
  async ({ ctx: { user } }) => {
    const suppliers = await suppliersService.getAllByCustomerID(user.customerID)
    return suppliers
  },
)

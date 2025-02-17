'use server'

import { attachmentRefTypeValidation } from '@/data/attachments'
import { sysAdminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { attachmentService } from '@/service/attachments'
import { fileService } from '@/service/file'
import { revalidatePath } from 'next/cache'
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
  ID: z.coerce.number(),
})

const uploadFileValidation = z.object({
  key: z.string(),
  type: z.string(),
  body: z.string(),
})

export const uploadFileAction = sysAdminAction
  .schema(uploadFileValidation)
  .action(async ({ parsedInput: { key, type, body } }) => {
    const b = Buffer.from(body, 'base64url')
    const arraybuffer = new Uint8Array(b)

    return await fileService.upload({ key, mimeType: type, body: arraybuffer })
  })

export const createAttachmentAction = sysAdminAction
  .schema(createAttachmentValidation)
  .action(async ({ parsedInput, ctx }) => {
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
      throw new ActionError(
        `Attachment blev ikke oprettet i databasen (${parsedInput.key})`,
      )
    }

    revalidatePath('/[lng]/varer/produkter/[id]', 'page')

    return {
      success: true,
      attachment: newAttachment,
    }
  })

export const deleteAttachmentAction = sysAdminAction
  .schema(deleteAttachmentValidation)
  .action(async ({ parsedInput }) => {
    const didDelete = await attachmentService.deleteByID(parsedInput.ID)
    if (!didDelete) {
      throw new ActionError(`Billede blev ikke slettet (${parsedInput.ID})`)
    }
  })

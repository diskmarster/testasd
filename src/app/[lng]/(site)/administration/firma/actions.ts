'use server'

import { adminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { revalidatePath } from 'next/cache'
import { createMailSetting } from './validation'

export const createMailSettingAction = adminAction
  .schema(createMailSetting)
  .action(async ({ parsedInput, ctx }) => {
    console.log({
      ...parsedInput.mails,
      email: parsedInput.email,
      userID: parsedInput.userID,
      locationID: parsedInput.locationID,
      customerID: ctx.user.customerID,
    })
    const mailSetting = await customerService.createMailSetting({
      ...parsedInput.mails,
      email: parsedInput.email,
      userID: parsedInput.userID,
      locationID: parsedInput.locationID,
      customerID: ctx.user.customerID,
    })
    if (!mailSetting) {
      throw new ActionError('Mailindstilling blev ikke oprettet')
    }
    revalidatePath(`/${ctx.lang}/administration/firma`)
  })

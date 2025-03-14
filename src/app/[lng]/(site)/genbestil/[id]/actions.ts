'use server'

import { EmailSendOrder } from '@/components/email/email-send-order'
import { editableAction } from '@/lib/safe-action'
import { attachmentService } from '@/service/attachments'
import { emailService } from '@/service/email'
import { userService } from '@/service/user'
import { sendEmailValidation } from './validation'

export const fetchUsersAction = editableAction.action(
  async ({ ctx: { user } }) => {
    const users = await userService.getAllByCustomerID(user.customerID)
    return users
  },
)

export const sendEmailAction = editableAction
  .schema(sendEmailValidation)
  .action(async ({ parsedInput, ctx }) => {
    const files = await attachmentService.getByRefID(
      'genbestil',
      parsedInput.orderID,
    )

    const fallbackURL = `https://lager.nemunivers.app/${ctx.lang}/genbestil/${files.at(0)?.refID}`

    await emailService.sendRecursively(
      [parsedInput.email],
      'NemLager bestilling modtaget',
      EmailSendOrder({
        company: ctx.customer?.company!,
        sender: ctx.user,
        link: files.at(0)?.url ?? fallbackURL,
      }),
    )
  })

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

export const sendOrderEmailAction = editableAction
  .metadata({ actionName: 'sendOrderEmail' })
  .schema(sendEmailValidation)
  .action(async ({ parsedInput, ctx }) => {
    const files = await attachmentService.getByRefID(
      'genbestil',
      parsedInput.orderID,
    )

    const fallbackURL = `https://lager.nemunivers.app/${ctx.lang}/genbestil/${parsedInput.orderID}`

    await emailService.sendRecursively(
      [parsedInput.email],
      `Ny bestilling via NemLager fra ${ctx.customer?.company}`,
      EmailSendOrder({
        company: ctx.customer?.company!,
        sender: ctx.user,
        link: files.at(0)?.url ?? fallbackURL,
      }),
    )
  })

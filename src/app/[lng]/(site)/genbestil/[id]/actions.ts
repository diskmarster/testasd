'use server'

import { EmailSendOrderInternal } from '@/components/email/email-send-order'
import { siteConfig } from '@/config/site'
import { editableAction } from '@/lib/safe-action'
import { attachmentService } from '@/service/attachments'
import { emailService } from '@/service/email'
import { ordersService } from '@/service/orders'
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
    const order = await ordersService.getByID(
      ctx.user.customerID,
      parsedInput.orderID,
    )

    const attachments = files.at(0)
      ? [
          {
            path: files[0].url,
            filename: `${siteConfig.name}-bestilling-${parsedInput.orderID}.xlsx`,
          },
        ]
      : []

    for (const email of parsedInput.emails) {
      await emailService.sendRecursively(
        [email],
        `Ny bestilling via NemLager fra ${ctx.customer?.company}`,
        EmailSendOrderInternal({
          customer: ctx.customer!,
          user: ctx.user,
          order: order,
        }),
        attachments,
      )
    }
  })

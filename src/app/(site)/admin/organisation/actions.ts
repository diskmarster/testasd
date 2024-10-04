'use server'

import { EmailInviteUser } from '@/components/email/email-invite-user'
import { siteConfig } from '@/config/site'
import { adminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { emailService } from '@/service/email'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { revalidatePath } from 'next/cache'
import {
  createNewLocationValidation,
  inviteNewUserValidation,
  toggleUserStatusValidation,
} from './validation'

export const toggleUserStatusAction = adminAction
  .schema(toggleUserStatusValidation)
  .action(async ({ parsedInput, ctx }) => {
    const didToggle = await userService.toggleUserStatusByID(parsedInput.userID)
    if (!didToggle) {
      throw new ActionError('Brugerens status blev ikke opdateret')
    }

    if (parsedInput.status) {
      sessionService.invalidateByID(parsedInput.userID)
    }

    revalidatePath('/admin/firma')
  })

export const inviteNewUserAction = adminAction
  .schema(inviteNewUserValidation)
  .action(async ({ parsedInput, ctx }) => {
    const existingUser = await userService.getByEmail(parsedInput.email)
    if (existingUser) {
      throw new ActionError('En bruger med den email findes allerede')
    }

    const customer = await customerService.getByID(ctx.user.customerID)

    const userInviteLink = await userService.createUserLink({
      email: parsedInput.email,
      role: parsedInput.role,
      customerID: ctx.user.customerID,
      locationIDs: parsedInput.locationIDs,
    })
    if (!userInviteLink) {
      throw new ActionError('Kunne ikke sende et aktiveringslink')
    }

    const subject = customer
      ? `${customer.company} har inviteret dig til ${siteConfig.name}`
      : `Du er blevet inviteret til ${siteConfig.name}`

    await emailService.sendRecursively(
      [parsedInput.email],
      subject,
      EmailInviteUser({ link: userInviteLink }),
    )
  })

export const createNewLocationAction = adminAction
  .schema(createNewLocationValidation)
  .action(async ({ parsedInput }) => {
    // 1. does location exist?
    // 2. create location
    // 3. create defualt batch and placement for location
    // 4. create zero-quantaties for every product for new location
    // 5. add user accesses for userIDs
    // 6. revalidates pathname

    const existingLocation = await locationService.getByName(
      parsedInput.name.trim(),
    )
    if (existingLocation) {
      throw new ActionError('Lokation findes allerede')
    }

    const didCreateLocation = await locationService.createWithAccess(
      parsedInput.name,
      parsedInput.customerID,
      parsedInput.userIDs,
    )
    if (!didCreateLocation) {
      throw new ActionError('Lokationen blev ikke oprettet')
    }

    revalidatePath(parsedInput.pathname)
  })

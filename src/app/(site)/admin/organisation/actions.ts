'use server'

import { EmailInviteUser } from '@/components/email/email-invite-user'
import { siteConfig } from '@/config/site'
import { adminAction } from '@/lib/safe-action'
import { ACTION_ERR_INTERNAL, ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import {
  isLocationLimitReached,
  isUserLimitReached,
} from '@/service/customer.utils'
import { emailService } from '@/service/email'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { revalidatePath } from 'next/cache'
import {
  changeLocationStatusValidation,
  changeUserStatusValidation,
  createNewLocationValidation,
  editLocationValidation,
  inviteNewUserValidation,
  resetUserPasswordValidation,
  updateCustomerValidation,
} from './validation'
import { passwordResetService } from '@/service/password-reset'

export const toggleUserStatusAction = adminAction
  .schema(changeUserStatusValidation)
  .action(async ({ parsedInput, ctx }) => {
    const status = parsedInput.status == 'active' ? true : false
    const userTogglePromises = parsedInput.userIDs.map(uID => {
      return userService.updateStatus(uID, status)
    })

    let userInvalidatePromises: Promise<void>[] = []
    if (parsedInput.status) {
      userInvalidatePromises = parsedInput.userIDs.map(uID => {
        return sessionService.invalidateByID(uID)
      })
    }

    const toggleResponses = await Promise.allSettled([
      ...userTogglePromises,
      ...userInvalidatePromises,
    ])

    for (const resp of toggleResponses) {
      if (resp.status == 'rejected') {
        throw new ActionError('Kunne ikke opdatere brugere')
      }
    }

    revalidatePath('/admin/organisation')
  })

export const inviteNewUserAction = adminAction
  .schema(inviteNewUserValidation)
  .action(async ({ parsedInput, ctx }) => {
    const existingUser = await userService.getByEmail(parsedInput.email)
    if (existingUser) {
      throw new ActionError('En bruger med den email findes allerede')
    }

    const users = await userService.getAllByCustomerID(ctx.user.customerID)
    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError('Kunne ikke finde firmakonto')
    }

    // TODO: add customers extra users to function below when its added
    if (isUserLimitReached(customer.plan, 0, users.length)) {
      throw new ActionError('Du har nået brugergrænsen')
    }

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
  .action(async ({ parsedInput, ctx }) => {
    // 1. is location limit reached?
    // 2. does location exist?
    // 3. create location
    // 4. create defualt batch and placement for location
    // 5. create zero-quantaties for every product for new location
    // 6. add user accesses for userIDs
    // 7. revalidates pathname

    const locations = await locationService.getByCustomerID(ctx.user.customerID)
    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError('Lokation findes allerede')
    }

    if (isLocationLimitReached(customer.plan, locations.length)) {
      throw new ActionError('Du har nået lokationsgrænsen')
    }

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

export const editLocationAction = adminAction
  .schema(editLocationValidation)
  .action(async ({ parsedInput, ctx }) => {
    // 1. fetch old accesses for location
    // 2. update location name
    // 3. create/remove user accesses
    // 4. revalidate path

    const oldLocationAccesses = await locationService.getAccessesByLocationID(
      parsedInput.locationID,
    )
    const oldUsersAccess = oldLocationAccesses.map(old => old.userID)

    const didUpdateLocation = await locationService.updateLocation(
      parsedInput.locationID,
      ctx.user.customerID,
      parsedInput.name,
      oldUsersAccess,
      parsedInput.userIDs,
    )
    if (!didUpdateLocation) {
      throw new ActionError('Lokationen blev ikke opdateret')
    }

    revalidatePath('/admin/organisation')
  })

export const changeLocationStatusAction = adminAction
  .schema(changeLocationStatusValidation)
  .action(async ({ parsedInput, ctx }) => {
    // 1. toggle location by ID
    // 2. revalidate path

    const status = parsedInput.status == 'active' ? false : true
    const locationTogglePromises = parsedInput.locationIDs.map(locID => {
      return locationService.updateStatus(locID, status)
    })

    const toggleResponses = await Promise.allSettled(locationTogglePromises)

    for (const resp of toggleResponses) {
      if (resp.status == 'rejected') {
        throw new ActionError('Kunne ikke opdatere lokationer')
      }
      if (resp.status == 'fulfilled' && resp.value == false) {
        throw new ActionError('Kunne ikke opdatere lokationer')
      }
    }

    revalidatePath('/admin/organisation')
  })

export const updateCustomerAction = adminAction
  .schema(updateCustomerValidation)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const updatedCustomer = customerService.updateByID(user.customerID, {
      ...parsedInput,
    })
    if (!updatedCustomer) {
      throw new ActionError('Firma blev ikke opdateret')
    }
    revalidatePath('/admin/organisation')
  })

export const resetUserPasswordAction = adminAction
  .schema(resetUserPasswordValidation)
  .action(async ({parsedInput}) => {
		const linkCreated = await passwordResetService.createAndSendLink(parsedInput.email)
		if (!linkCreated) {
			throw new ActionError(
				`${ACTION_ERR_INTERNAL}. Kunne ikke oprette nulstillings link`,
			)
    }
  })

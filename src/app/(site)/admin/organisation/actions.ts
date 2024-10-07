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
  changeLocationStatusValidation,
  changeUserStatusValidation,
  createNewLocationValidation,
  editLocationValidation,
  inviteNewUserValidation,
} from './validation'

export const toggleUserStatusAction = adminAction
  .schema(changeUserStatusValidation)
  .action(async ({ parsedInput, ctx }) => {
    console.log('input', parsedInput)
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

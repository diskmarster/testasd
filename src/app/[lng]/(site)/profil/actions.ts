'use server'

import {
  adminUpdateProfileValidation,
  deleteProfileValidation,
  updatePasswordValidation,
  updatePinValidation,
  updatePrimaryLocationValidation,
  updateProfileValidation,
} from '@/app/[lng]/(site)/profil/validation'
import { adminAction, privateAction } from '@/lib/safe-action'
import { ACTION_ERR_UNAUTHORIZED, ActionError } from '@/lib/safe-action/error'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export const updateProfileInformationAction = privateAction
  .metadata({actionName: 'updateProfileInformation'})
  .schema(updateProfileValidation)
  .action(async ({ parsedInput, ctx: { user, lang } }) => {
    const updatedUser = userService.updateByID(user.id, { ...parsedInput })
    if (!updatedUser) {
      throw new ActionError('Profil blev ikke opdateret')
    }
    revalidatePath(`${lang}/profil`)
  })

export const adminUpdateProfileInformationAction = adminAction
  .metadata({actionName: 'adminUpdateProfileInformation'})
  .schema(adminUpdateProfileValidation)
  .action(
    async ({ parsedInput: { userId, ...userInfo }, ctx: { user, lang } }) => {},
  )

export const deleteProfileAction = privateAction
  .metadata({actionName: 'deleteProfile'})
  .schema(deleteProfileValidation)
  .action(async ({ parsedInput: { userId }, ctx: { session, user, lang } }) => {
    const isSameUser = userId === user.id
    if (!isSameUser) {
      throw new ActionError(ACTION_ERR_UNAUTHORIZED)
    }
    const isDeleted = await userService.deleteByID(user.id)
    if (!isDeleted) {
      throw new ActionError('Der gik noget galt med sletningen')
    }
    await sessionService.delete(session.id)
    redirect(`${lang}/log-ind`)
  })

export const updatePasswordAction = privateAction
  .metadata({actionName: 'updatePassword'})
  .schema(updatePasswordValidation)
  .action(
    async ({
      parsedInput: { currentPassword, newPassword },
      ctx: { user, lang },
    }) => {
      const isValidPassword = await userService.verifyPassword(
        user.email,
        currentPassword,
      )
      if (!isValidPassword) {
        throw new ActionError('Kodeord er ikke korrekt')
      }

      const updatedUser = await userService.updatePassword(user.id, newPassword)
      if (!updatedUser) {
        throw new ActionError('Kodeord blev ikke opdateret')
      }
      const sessionID = await sessionService.create(updatedUser.id)
      revalidatePath(`${lang}/profil`)
    },
  )

export const updatePinAction = privateAction
  .metadata({actionName: 'updatePin'})
  .schema(updatePinValidation)
  .action(
    async ({ parsedInput: { currentPin, newPin }, ctx: { user, lang } }) => {
      const isValidPin = await userService.verifyPin(user.email, currentPin)
      if (!isValidPin) {
        throw new ActionError('Din PIN-kode er ikke korrekt. Prøv igen.')
      }
      const updatedPin = await userService.updatePin(user.id, newPin)
      if (!updatedPin) {
        throw new ActionError(
          'Der skete en fejl, PIN-koden blev ikke opdateret.',
        )
      }
      revalidatePath(`${lang}/profil`)
    },
  )

export const updatePrimaryLocationAction = privateAction
  .metadata({actionName: 'updatePrimaryLocation'})
  .schema(updatePrimaryLocationValidation)
  .action(async ({ parsedInput: { locationID }, ctx: { user, lang } }) => {
    console.log('locID', locationID)
    const locations = await locationService.getAllByUserID(user.id)

    if (!locations.some(loc => loc.id == locationID)) {
      throw new ActionError('Du har ikke adgang til denne lokation')
    }

    const didUpdate = await locationService.toggleLocationPrimary(
      user.id,
      locationID,
    )
    if (!didUpdate) {
      throw new ActionError('Din hovedlokation blev ikke opdateret')
    }

    revalidatePath(`${lang}/profil`)
  })

'use server'

import {
  adminUpdateProfileValidation,
  deleteProfileValidation,
  updatePasswordValidation,
  updatePinValidation,
  updatePrimaryLocationValidation,
  updateProfileValidation,
} from '@/app/[lng]/(site)/profil/validation'
import { serverTranslation } from '@/app/i18n'
import { adminAction, authedAction, getSchema } from '@/lib/safe-action'
import { ACTION_ERR_UNAUTHORIZED, ActionError } from '@/lib/safe-action/error'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export const updateProfileInformationAction = authedAction
  .metadata({ actionName: 'updateProfileInformation' })
  .schema(async () => await getSchema(updateProfileValidation, 'validation'))
  .action(async ({ parsedInput, ctx: { user, lang } }) => {
    const { t } = await serverTranslation(lang, 'action-errors')
    const updatedUser = userService.updateByID(user.id, { ...parsedInput })
    if (!updatedUser) {
      throw new ActionError(t('profile-action.profile-not-updated'))
    }
    revalidatePath(`${lang}/profil`)
  })

export const adminUpdateProfileInformationAction = adminAction
  .metadata({ actionName: 'adminUpdateProfileInformation' })
  .schema(
    async () => await getSchema(adminUpdateProfileValidation, 'validation'),
  )
  .action(
    async ({ parsedInput: { userId, ...userInfo }, ctx: { user, lang } }) => {},
  )

export const deleteProfileAction = authedAction
  .metadata({ actionName: 'deleteProfile' })
  .schema(deleteProfileValidation)
  .action(async ({ parsedInput: { userId }, ctx: { session, user, lang } }) => {
    const { t } = await serverTranslation(lang, 'action-errors')
    const isSameUser = userId === user.id
    if (!isSameUser) {
      throw new ActionError(ACTION_ERR_UNAUTHORIZED)
    }
    const isDeleted = await userService.deleteByID(user.id)
    if (!isDeleted) {
      throw new ActionError(t('profile-action.profile-not-deleted'))
    }
    await sessionService.delete(session.id)
    redirect(`${lang}/log-ind`)
  })

export const updatePasswordAction = authedAction
  .metadata({ actionName: 'updatePassword', excludeError: true })
  .schema(async () => await getSchema(updatePasswordValidation, 'validation'))
  .action(
    async ({
      parsedInput: { currentPassword, newPassword },
      ctx: { user, lang },
    }) => {
      const { t } = await serverTranslation(lang, 'action-errors')
      const isValidPassword = await userService.verifyPassword(
        user.email,
        currentPassword,
      )
      if (!isValidPassword) {
        throw new ActionError(t('profile-action.password-not-correct'))
      }

      const updatedUser = await userService.updatePassword(user.id, newPassword)
      if (!updatedUser) {
        throw new ActionError(t('profile-action.password-not-updated'))
      }
      const sessionID = await sessionService.create(updatedUser.id)
      revalidatePath(`${lang}/profil`)
    },
  )

export const updatePinAction = authedAction
  .metadata({ actionName: 'updatePin', excludeError: true })
  .schema(async () => await getSchema(updatePinValidation, 'validation'))
  .action(
    async ({ parsedInput: { currentPin, newPin }, ctx: { user, lang } }) => {
      const { t } = await serverTranslation(lang, 'action-errors')
      const isValidPin = await userService.verifyPin(user.email, currentPin)
      if (!isValidPin) {
        throw new ActionError(t('profile-action.pin-not-correct'))
      }
      const updatedPin = await userService.updatePin(user.id, newPin)
      if (!updatedPin) {
        throw new ActionError(t('profile-action.pin-not-updated'))
      }
      revalidatePath(`${lang}/profil`)
    },
  )

export const updatePrimaryLocationAction = authedAction
  .metadata({ actionName: 'updatePrimaryLocation' })
  .schema(updatePrimaryLocationValidation)
  .action(async ({ parsedInput: { locationID }, ctx: { user, lang } }) => {
    const { t } = await serverTranslation(lang, 'action-errors')
    const locations = await locationService.getAllByUserID(user.id)

    if (!locations.some(loc => loc.id == locationID)) {
      throw new ActionError(t('profile-action.no-access-to-location'))
    }

    const didUpdate = await locationService.toggleLocationPrimary(
	  user.customerID,
      user.id,
      locationID,
    )
    if (!didUpdate) {
		throw new ActionError(t('profile-action.primary-location-not-updated'))
    }

    revalidatePath(`${lang}/profil`)
  })

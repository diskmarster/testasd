"use server"

import {
  adminUpdateProfileValidation,
  deleteProfileValidation,
  updatePasswordValidation,
  updateProfileValidation,
} from '@/app/(site)/profil/validation'
import { adminAction, privateAction } from '@/lib/safe-action'
import { ACTION_ERR_UNAUTHORIZED, ActionError } from '@/lib/safe-action/error'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export const updateProfileInformationAction = privateAction
  .schema(updateProfileValidation)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const updatedUser = userService.updateByID(user.id, { ...parsedInput })
    if (!updatedUser) {
      throw new ActionError("Profil blev ikke opdateret")
    }
    revalidatePath("/profil")
  })

export const adminUpdateProfileInformationAction = adminAction
  .schema(adminUpdateProfileValidation)
  .action(async ({ parsedInput: { userId, ...userInfo }, ctx: { user } }) => { })

export const deleteProfileAction = privateAction
  .schema(deleteProfileValidation)
  .action(async ({ parsedInput: { userId }, ctx: { session, user } }) => {
    const isSameUser = userId === user.id
    if (!isSameUser) {
      throw new ActionError(ACTION_ERR_UNAUTHORIZED)
    }
    const isDeleted = await userService.deleteByID(user.id)
    if (!isDeleted) {
      throw new ActionError("Der gik noget galt med sletningen")
    }
    await sessionService.delete(session.id)
    redirect("/log-ind")
  })

export const updatePasswordAction = privateAction
  .schema(updatePasswordValidation)
  .action(
    async ({ parsedInput: { currentPassword, newPassword }, ctx: { user }, }) => {
      const isValidPassword = await userService.verifyPassword(user.email, currentPassword)
      if (!isValidPassword) {
        throw new ActionError("Kodeord er ikke korrekt")
      }
      const updatedUser = await userService.updatePassword(user.id, newPassword)
      if (!updatedUser) {
        throw new ActionError("Kodeord blev ikke opdateret")
      }
      const sessionID = await sessionService.create(updatedUser.id)
      revalidatePath("/profil")
    })

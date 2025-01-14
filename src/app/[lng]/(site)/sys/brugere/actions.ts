'use server'

import { sysAdminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { userService } from '@/service/user'
import { revalidatePath } from 'next/cache'
import {
  deleteInviteLinkValidation,
  deleteUserByIDValidation,
  refreshInviteLinkValidation,
} from './validation'

export const deleteUserAction = sysAdminAction
  .metadata({ actionName: 'deleteUserAction', excludeAnalytics: true })
  .schema(deleteUserByIDValidation)
  .action(async ({ parsedInput: { userID }, ctx: { user, lang } }) => {
    if (user.id == userID) {
      throw new ActionError('Du kan ikke slette din egen bruger')
    }

    const deleted = await userService.deleteByID(userID)
    if (!deleted) {
      throw new ActionError('Brugeren blev ikke slettet')
    }

    revalidatePath(`/${lang}/sys/brugere`)
  })

export const deleteInviteLinkAction = sysAdminAction
  .metadata({ actionName: 'deleteInviteLinkAction', excludeAnalytics: true })
  .schema(deleteInviteLinkValidation)
  .action(async ({ parsedInput: { linkID }, ctx: { lang } }) => {
    const deleted = await userService.deleteUserLink(linkID)
    if (!deleted) {
      throw new ActionError('Link blev ikke slettet')
    }
    revalidatePath(`/${lang}/sys/brugere`)
  })

export const refreshInviteLinkAction = sysAdminAction
  .schema(refreshInviteLinkValidation)
  .action(async ({ parsedInput: { linkID }, ctx: { lang } }) => {
    const link = await userService.getInviteLinkByID(linkID)
    link!.inserted = new Date()
    const refreshedLink = await userService.createUserLink(link!)
    revalidatePath(`/${lang}/sys/brugere`)
  })

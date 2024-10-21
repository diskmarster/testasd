'use server'

import { signInValidation } from '@/app/[lng]/(auth)/log-ind/validation'
import { serverTranslation } from '@/app/i18n'
import { publicAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { redirect } from 'next/navigation'

export const signInAction = publicAction
  .metadata({ actionName: 'signIn' })
  .schema(signInValidation)
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const existingUser = await userService.verifyPassword(
      parsedInput.email.toLowerCase(),
      parsedInput.password,
    )
    if (!existingUser) {
      throw new ActionError(t('log-in-action.wrong-credentials'))
    }
    if (!existingUser.isActive) {
      throw new ActionError(t('log-in-action.user-inactive'))
    }

    // TODO: add translation here
    if (!existingUser.webAccess) {
      throw new ActionError('Bruger har ikke web adgang')
  }

    await sessionService.invalidateByID(existingUser.id)
    const newSessionID = await sessionService.create(existingUser.id)

    // @ts-ignore -- This is just for analytics, so we dont care about the other properties
    ctx.session = {
      id: newSessionID,
    }
    ctx.user = existingUser

    redirect(`/${ctx.lang}/oversigt`)
  })

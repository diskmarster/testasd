'use server'

import { signInValidation } from '@/app/[lng]/(auth)/log-ind/validation'
import { publicAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { redirect } from 'next/navigation'

export const signInAction = publicAction
  .schema(signInValidation)
  .action(async ({ parsedInput, ctx }) => {
    const existingUser = await userService.verifyPassword(
      parsedInput.email.toLowerCase(),
      parsedInput.password,
    )
    if (!existingUser) {
      throw new ActionError('Forkert email eller kodeord')
    }
    if (!existingUser.isActive) {
      throw new ActionError('Brugeren er inaktiv')
    }
    const newSessionID = await sessionService.create(existingUser.id)

    redirect(`/${ctx.lang}/oversigt`)
  })

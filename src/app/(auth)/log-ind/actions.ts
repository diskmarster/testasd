'use server'

import { signInValidation } from '@/app/(auth)/log-ind/validation'
import { publicAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { redirect } from 'next/navigation'

export const signInAction = publicAction
  .metadata({ actionName: 'signIn' })
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

    await sessionService.invalidateByID(existingUser.id)
    const newSessionID = await sessionService.create(existingUser.id)

    // @ts-ignore -- This is just for analytics, so we dont care about the other properties
    ctx.session = {
      id: newSessionID,
    }
    ctx.user = existingUser

    redirect('/oversigt')
  })

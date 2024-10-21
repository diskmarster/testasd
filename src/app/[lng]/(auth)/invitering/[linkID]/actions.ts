'use server'

import { signUpInvitedValidation } from '@/app/[lng]/(auth)/invitering/[linkID]/validation'
import { serverTranslation } from '@/app/i18n'
import { EmailTest } from '@/components/email/email-test'
import { publicAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { emailService } from '@/service/email'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { redirect } from 'next/navigation'

export const signUpInvitedAction = publicAction
  .metadata({actionName: 'signUpInvite'})
  .schema(signUpInvitedValidation)
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const activationLink = await userService.getInviteLinkByID(
      parsedInput.linkID,
    )
    if (!activationLink) {
      throw new ActionError(t('invited-user-action.link-no-longer-exists'))
    }

    const isLinkValid = userService.validateUserLink(activationLink.inserted)
    if (!isLinkValid) {
      throw new ActionError(t('invited-user-action.expired-link'))
    }

    const existingCustomer = await customerService.getByID(parsedInput.clientID)
    if (!existingCustomer) {
      throw new ActionError(
        t('invited-user-action.company-account-doesnt-exist'),
      )
    }

    const existingUser = await userService.getByEmail(parsedInput.email)
    if (existingUser) {
      throw new ActionError(t('invited-user-action.existing-user-mail'))
    }

    const newUser = await userService.createInvitedUser(activationLink, {
      customerID: parsedInput.clientID,
      name: parsedInput.name,
      email: parsedInput.email,
      hash: parsedInput.password,
      pin: parsedInput.pin,
      role: activationLink.role,
      isActive: true,
    })
    if (!newUser) {
      throw new ActionError(t('invited-user-action.user-not-created'))
    }

    const isLinkDeleted = await userService.deleteUserLink(parsedInput.linkID)
    if (!isLinkDeleted) {
      console.error(
        `${t('invited-user-action.invitation-link-not-deleted')} ${newUser.id}`,
      )
    }

    locationService.setCookie(activationLink.locationIDs[0])
    await sessionService.create(newUser.id)

    await emailService.sendRecursively(
      [parsedInput.email],
      'Velkommen til Nem Lager',
      EmailTest(),
    )

    redirect(`/${ctx.lang}/oversigt`)
  })

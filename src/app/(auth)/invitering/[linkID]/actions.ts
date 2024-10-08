'use server'

import { signUpValidation } from '@/app/(auth)/registrer/[linkID]/validation'
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
  .schema(signUpValidation)
  .action(async ({ parsedInput }) => {
    const activationLink = await userService.getInviteLinkByID(
      parsedInput.linkID,
    )
    if (!activationLink) {
      throw new ActionError('Dit aktiveringslink findes ikke længere')
    }

    const isLinkValid = userService.validateUserLink(activationLink.inserted)
    if (!isLinkValid) {
      throw new ActionError('Dit aktiveringslink er ikke længere gyldigt')
    }

    const existingCustomer = await customerService.getByID(parsedInput.clientID)
    if (!existingCustomer) {
      throw new ActionError('Din firmakonto findes ikke')
    }

    const existingUser = await userService.getByEmail(parsedInput.email)
    if (existingUser) {
      throw new ActionError('En bruger med den email findes allerede')
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
      throw new ActionError('Din bruger blev ikke oprettet')
    }

    const isLinkDeleted = await userService.deleteUserLink(parsedInput.linkID)
    if (!isLinkDeleted) {
      console.error(
        `inviterings link blev ikke slettet for brugerID ${newUser.id}`,
      )
    }

    locationService.setCookie(activationLink.locationIDs[0])
    await sessionService.create(newUser.id)

    emailService.sendRecursively(
      [parsedInput.email],
      'Velkommen til Nem Lager',
      EmailTest(),
    )

    redirect('/oversigt')
  })

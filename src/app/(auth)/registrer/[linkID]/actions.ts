'use server'

import { signUpValidation } from '@/app/(auth)/registrer/[linkID]/validation'
import { EmailTest } from '@/components/email/email-test'
import { publicAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { isUserLimitReached } from '@/service/customer.utils'
import { emailService } from '@/service/email'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { redirect } from 'next/navigation'

export const signUpAction = publicAction
  .metadata({actionName: 'signUp'})
  .schema(signUpValidation)
  .action(async ({ parsedInput }) => {
    const activationLink = await customerService.getActivationLinkByID(
      parsedInput.linkID,
    )
    if (!activationLink) {
      throw new ActionError('Dit aktiveringslink findes ikke længere')
    }

    const isLinkValid = customerService.validateActivationLink(
      activationLink.inserted,
    )
    if (!isLinkValid) {
      throw new ActionError('Dit aktiveringslink er ikke længere gyldigt')
    }

    const users = await userService.getAllByCustomerID(parsedInput.clientID)
    const existingCustomer = await customerService.getByID(parsedInput.clientID)
    if (!existingCustomer) {
      throw new ActionError('Din firmakonto findes ikke')
    }

    if (
      isUserLimitReached(
        existingCustomer.plan,
        existingCustomer.extraUsers,
        users.length,
      )
    ) {
      throw new ActionError('Dit firma har nået brugergrænsen')
    }

    const existingUser = await userService.getByEmail(parsedInput.email)
    if (existingUser) {
      throw new ActionError('En bruger med den email findes allerede')
    }

    const newUser = await userService.register({
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

    if (!existingCustomer.isActive) {
      const isCustomerToggled = await customerService.toggleActivationByID(
        existingCustomer.id,
      )
      if (!isCustomerToggled) {
        throw new ActionError('Din firmakonto blev ikke aktiveret')
      }
    }

    const isAccessAdded = await locationService.addAccess({
      userID: newUser.id,
      locationID: activationLink.locationID,
      customerID: existingCustomer.id,
      isPrimary: true,
    })
    if (!isAccessAdded) {
      throw new ActionError(
        'Der gik noget galt med at give brugeren tilladelse til lokation',
      )
    }

    const isLinkDeleted = await customerService.deleteActivationLink(
      parsedInput.linkID,
    )
    if (!isLinkDeleted) {
      // NOTE: What to do?
    }

    locationService.setCookie(activationLink.locationID)
    await sessionService.create(newUser.id)

    emailService.sendRecursively(
      [parsedInput.email],
      'Velkommen til Nem Lager',
      EmailTest(),
    )

    redirect('/oversigt')
  })

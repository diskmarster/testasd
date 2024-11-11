'use server'

import { serverTranslation } from '@/app/i18n'
import { EmailWelcomeCustomer } from '@/components/email/email-welcome-customer'
import { getSchema, sysAdminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { emailService } from '@/service/email'
import { locationService } from '@/service/location'
import { userService } from '@/service/user'
import { generateIdFromEntropySize } from 'lucia'
import { revalidatePath } from 'next/cache'
import {
  createClientValidation,
  deleteClientStatusValidation,
  toggleClientStatusValidation,
} from './validation'

export const createClientAction = sysAdminAction
  .schema(async () => await getSchema(createClientValidation, 'kunder'))
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'kunder')
    const actionErrosNS = 'create-action-errors'

    const existingCustomer = await customerService.getByEmail(parsedInput.email)
    if (existingCustomer) {
      throw new ActionError(t(actionErrosNS + '.client-exists'))
    }

    const existingUser = await userService.getByEmail(parsedInput.email)
    if (existingUser) {
      throw new ActionError(t(actionErrosNS + '.user-exists'))
    }

    const newCustomer = await customerService.create(parsedInput)
    if (!newCustomer) {
      throw new ActionError(t(actionErrosNS + '.client-not-created'))
    }

    const newLocationID = generateIdFromEntropySize(8)
    const newLocation = await locationService.create({
      id: newLocationID,
      customerID: newCustomer.id,
      name: 'Hovedlokation',
    })
    if (!newLocation) {
      throw new ActionError(t(actionErrosNS + '.location-not-created'))
    }

    const activationLink = await customerService.createActivationLink({
      customerID: newCustomer.id,
      email: newCustomer.email,
      locationID: newLocation.id,
      role: 'administrator',
    })
    if (!activationLink) {
      throw new ActionError(t(actionErrosNS + '.mail-not-sent'))
    }

    await emailService.sendRecursively(
      [parsedInput.email],
      'Velkommen til Nem Lager',
      EmailWelcomeCustomer({
        company: newCustomer.company,
        link: activationLink,
      }),
    )
  })

export const toggleClientAction = sysAdminAction
  .schema(toggleClientStatusValidation)
  .action(async ({ parsedInput, ctx }) => {
    const isUpdated = await customerService.toggleActivationByID(
      parsedInput.customerID,
    )
    if (!isUpdated) {
      throw new ActionError('toggle-action-errors.client-not-updated')
    }

    revalidatePath(`/${ctx.lang}/sys/kunder`)
  })

export const deleteClientAction = sysAdminAction
  .schema(deleteClientStatusValidation)
  .action(async ({ parsedInput, ctx }) => {
    const isUpdated = await customerService.deleteByID(parsedInput.customerID)
    if (!isUpdated) {
      throw new ActionError('delete-action-errors.client-not-deleted')
    }

    revalidatePath(`/${ctx.lang}/sys/kunder`)
  })

'use server'

import { serverTranslation } from '@/app/i18n'
import { EmailWelcomeCustomer } from '@/components/email/email-welcome-customer'
import { hasPermissionByRank } from '@/data/user.types'
import { adminAction, getSchema, sysAdminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { emailService } from '@/service/email'
import { locationService } from '@/service/location'
import { productService } from '@/service/products'
import { userService } from '@/service/user'
import { generateIdFromEntropySize } from 'lucia'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  createClientValidation,
  deleteClientStatusValidation,
  importHistoryValidation,
  importInventoryValidation,
  toggleClientStatusValidation,
  updateClientValidation,
} from './validation'
import { inventoryService } from '@/service/inventory'

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

export const updateClientAction = sysAdminAction
  .schema(async () => await getSchema(updateClientValidation, 'kunder'))
  .action(async ({ parsedInput, ctx }) => {
    const { customerID, ...rest } = parsedInput
    const updatedCustomer = await customerService.updateByID(
      parsedInput.customerID,
      { ...rest },
    )
    if (!updatedCustomer) {
      throw new ActionError('update-action-errors.client-not-updated')
    }
    revalidatePath(`/${ctx.lang}/sys/kunder`)
  })

export const importInventoryAction = sysAdminAction
  .schema(importInventoryValidation)
  .action(async ({ parsedInput }) => {
    const skippedSkus = await productService.importInventoryQuantities({
      customerID: parsedInput.customerID,
      locationID: parsedInput.locationID,
      items: parsedInput.items,
    })

    return skippedSkus
  })

export const fetchLocationsForCustomerActions = adminAction
  .schema(z.object({ customerID: z.coerce.number() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (hasPermissionByRank(user.role, 'system_administrator')) {
      const locations = await locationService.getByCustomerID(
        parsedInput.customerID,
      )
      return locations.map(l => ({ id: l.id, name: l.name }))
    } else {
      const locations = await locationService.getAllActiveByUserID(user.id)
      return locations.map(l => ({ id: l.id, name: l.name }))
    }
  })

export const importHistoryAction = sysAdminAction
  .schema(importHistoryValidation)
  .action(async ({ parsedInput }) => {
    await productService.importInventoryHistory(parsedInput, '(v1)')
  })

export const fetchItemGroupsForCustomerActions = adminAction
  .schema(z.object({ customerID: z.coerce.number() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
		const itemGroups = await inventoryService.getActiveGroupsByID(parsedInput.customerID)
		return itemGroups.map(g => ({id: g.id, name: g.name}))
  })

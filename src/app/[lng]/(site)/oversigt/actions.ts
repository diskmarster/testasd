'use server'

import { serverTranslation } from '@/app/i18n'
import { authedAction, editableAction, getSchema } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { attachmentService } from '@/service/attachments'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  moveInventoryValidation,
  updateInventoryValidation,
} from './validation'

export const updateInventoryAction = editableAction
  .metadata({ actionName: 'updateInventory' })
  .schema(async () => await getSchema(updateInventoryValidation, 'validation'))
  .action(
    async ({
      parsedInput: { productID, placementID, batchID, type, amount, reference },
      ctx,
    }) => {
      const { t } = await serverTranslation(ctx.lang, 'action-errors')
      const location = await locationService.getLastVisited(ctx.user.id)
      if (!location) {
        throw new ActionError(t('overview-action.location-not-found'))
      }
      const customer = await customerService.getByID(ctx.user.customerID)
      if (!customer) {
        throw new ActionError(t('overview-action.customer-not-found'))
      }

      if (typeof placementID != 'number') {
        const newPlacement = await inventoryService.createPlacement(
          {
            name: placementID,
            locationID: location,
          },
          ctx.lang,
        )
        if (!newPlacement) {
          throw new ActionError(t('overview-action.placement-not-created'))
        }
        placementID = newPlacement.id
      }

      if (typeof batchID != 'number') {
        const newBatch = await inventoryService.createBatch(
          {
            batch: batchID,
            locationID: location,
          },
          ctx.lang,
        )
        if (!newBatch) {
          throw new ActionError(t('overview-action.batch-not-created'))
        }
        batchID = newBatch.id
      }

      if (type == 'afgang') {
        const exactInventory = await inventoryService.getInventoryByIDs(
          productID,
          placementID,
          batchID,
        )
        if (!exactInventory) {
          throw new ActionError(t('overview-action.exact-inventory-not-found'))
        }
      }

      await inventoryService.upsertInventory(
        'web',
        customer.id,
        ctx.user.id,
        location,
        productID,
        placementID,
        batchID,
        type,
        type == 'tilgang' ? amount : -amount,
        reference,
        ctx.lang,
      )

      revalidatePath(`/${ctx.lang}/oversigt`)
    },
  )

export const moveInventoryAction = editableAction
  .metadata({ actionName: 'moveInventory' })
  .schema(async () => await getSchema(moveInventoryValidation, 'validation'))
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const location = await locationService.getLastVisited(ctx.user.id)
    if (!location) {
      throw new ActionError(t('overview-action.location-not-found'))
    }
    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError(t('overview-action.customer-not-found'))
    }

    await inventoryService.moveInventory(
      'web',
      customer.id,
      ctx.user.id,
      location,
      parsedInput.productID,
      parsedInput.fromPlacementID,
      parsedInput.fromBatchID,
      parsedInput.toPlacementID,
      'flyt',
      parsedInput.amount,
      parsedInput.reference,
      ctx.lang,
    )

    revalidatePath(`/${ctx.lang}/oversigt`)
  })

export const fetchProductFilesAction = authedAction
  .schema(z.object({ id: z.coerce.number() }))
  .action(async ({ parsedInput: { id } }) => {
    const files = await attachmentService.getByRefID('product', id)

    return { files }
  })

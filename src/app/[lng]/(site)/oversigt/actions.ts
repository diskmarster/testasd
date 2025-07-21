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

export type BulkError = {
  message: string
  productID: number
}

const bulkOutgoingValidation = z.object({
  reference: z.string().optional(),
  items: z
    .array(
      z.object({
        sku: z.string(), // til fejlbeskeder
        productID: z.coerce.number(),
        placementID: z.coerce.number(),
        batchID: z.coerce.number(),
        quanity: z.coerce.number(),
      }),
    )
    .min(1),
})

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
        null,
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
      null,
    )

    revalidatePath(`/${ctx.lang}/oversigt`)
  })

export const fetchProductFilesAction = authedAction
  .schema(z.object({ id: z.coerce.number() }))
  .action(async ({ parsedInput: { id } }) => {
    const files = await attachmentService.getByRefID('product', id)

    return { files }
  })

export const fetchPlacementInventories = authedAction
  .schema(z.object({ placementID: z.coerce.number() }))
  .action(async ({ parsedInput: { placementID }, ctx: { user, lang } }) => {
      const { t } = await serverTranslation(lang, 'oversigt', {
        keyPrefix: 'bulk',
      })

    const currentLocation = await locationService.getLastVisited(user.id)
    if (!currentLocation) {
        throw new ActionError(t('err-no-location'))
    }

    const inventories = await inventoryService.getInventoriesByPlacementID(
      user.customerID,
      currentLocation,
      placementID,
    )

    return { inventories }
  })

export const bulkOutgoingAction = authedAction
  .schema(bulkOutgoingValidation)
  .action(
    async ({ parsedInput: { reference, items }, ctx: { lang, user } }) => {
      const { t } = await serverTranslation(lang, 'oversigt', {
        keyPrefix: 'bulk',
      })

      const currentLocation = await locationService.getLastVisited(user.id)
      if (!currentLocation) {
        throw new ActionError(t('err-no-location'))
      }

      const errs: BulkError[] = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item.quanity <= 0) {
          errs.push({
            message: t('err-negative-quantity', { sku: item.sku }),
            productID: item.productID,
          })
          continue
        }

        const didUpdate = await inventoryService.upsertInventory(
          'web',
          user.customerID,
          user.id,
          currentLocation,
          item.productID,
          item.placementID,
          item.batchID,
          'afgang',
          -item.quanity,
          reference ? t('reference', { ref: reference }) : t('reference-empty'),
          null,
          lang,
        )

        if (!didUpdate) {
          errs.push({
            message: t('err-bulk-failed', { sku: item.sku }),
            productID: item.productID,
          })
        }
      }

      revalidatePath(`/${lang}/oversigt`)

      if (errs.length > 0) {
        return {
          ok: false,
          errors: errs,
        }
      }
    },
  )

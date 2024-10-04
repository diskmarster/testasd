'use server'

import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import {
  moveInventoryValidation,
  updateInventoryValidation,
} from './validation'

export const updateInventoryAction = privateAction
  .schema(updateInventoryValidation)
  .action(
    async ({
      parsedInput: { productID, placementID, batchID, type, amount, reference },
      ctx,
    }) => {
      const location = await locationService.getLastVisited(ctx.user.id)
      if (!location) {
        throw new ActionError('Kunne ikke finde din lokation')
      }
      const customer = await customerService.getByID(ctx.user.customerID)
      if (!customer) {
        throw new ActionError('Firmakonto findes ikke i systemet')
      }

      if (typeof placementID != 'number') {
        const newPlacement = await inventoryService.createPlacement({
          name: placementID,
          locationID: location,
        })
        if (!newPlacement) {
          throw new ActionError('Ny placering blev ikke oprettet')
        }
        placementID = newPlacement.id
      }

      if (typeof batchID != 'number') {
        const newBatch = await inventoryService.createBatch({
          batch: batchID,
          locationID: location,
        })
        if (!newBatch) {
          throw new ActionError('Ny batchnr. blev ikke oprettet')
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
          throw new ActionError('Den præcise beholdning findes ikke')
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
      )

      revalidatePath('/oversigt')
    },
  )

export const moveInventoryAction = privateAction
  .schema(moveInventoryValidation)
  .action(async ({ parsedInput, ctx }) => {
    const location = await locationService.getLastVisited(ctx.user.id)
    if (!location) {
      throw new ActionError('Kunne ikke finde din lokation')
    }
    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError('Firmakonto findes ikke i systemet')
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
    )

    revalidatePath('/oversigt')
  })

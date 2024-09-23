'use server'

import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import {
  addOrderedToReorderValidation,
  createReorderValidation,
  deleteReorderValidation,
  updateReorderValidation,
} from './validation'

export const createReorderAction = privateAction
  .schema(createReorderValidation)
  .action(async ({ parsedInput, ctx }) => {
    const existsLocation = await locationService.getByID(parsedInput.locationID)
    if (!existsLocation) {
      throw new ActionError('Firma lokation findes ikke i databasen')
    }
    if (existsLocation.customerID != ctx.user.customerID) {
      throw new ActionError('Firma lokation tilhører dit firma')
    }

    const newReorder = await inventoryService.createReorder({
      ...parsedInput,
      customerID: ctx.user.customerID,
    })
    if (!newReorder) {
      throw new ActionError('Minimums beholdning blev ikke oprettet')
    }

    revalidatePath('/genbestil')
  })

export const updateReorderAction = privateAction
  .schema(updateReorderValidation)
  .action(async ({ parsedInput, ctx }) => {
    const existsLocation = await locationService.getByID(parsedInput.locationID)
    if (!existsLocation) {
      throw new ActionError('Firma lokation findes ikke i databasen')
    }
    if (existsLocation.customerID != ctx.user.customerID) {
      throw new ActionError('Firma lokation tilhører dit firma')
    }

    const newReorder = await inventoryService.updateReorderByIDs(
      parsedInput.productID,
      parsedInput.locationID,
      ctx.user.customerID,
      {
        minimum: parsedInput.minimum,
        buffer: parsedInput.buffer / 100,
      },
    )
    if (!newReorder) {
      throw new ActionError('Minimums beholdning blev ikke opdateret')
    }

    revalidatePath('/genbestil')
  })

export const deleteReorderAction = privateAction
  .schema(deleteReorderValidation)
  .action(async ({ parsedInput, ctx }) => {
    const existsLocation = await locationService.getByID(parsedInput.locationID)
    if (!existsLocation) {
      throw new ActionError('Firma lokation findes ikke i databasen')
    }
    if (existsLocation.customerID != ctx.user.customerID) {
      throw new ActionError('Firma lokation tilhører dit firma')
    }

    const didDelete = await inventoryService.deleteReorderByIDs(
      parsedInput.productID,
      parsedInput.locationID,
      ctx.user.customerID,
    )
    if (!didDelete) {
      throw new ActionError('Minimums beholdning blev ikke slettet')
    }

    revalidatePath('/genbestil')
  })

export const addOrderedToReorderAction = privateAction
  .schema(addOrderedToReorderValidation)
  .action(async ({ parsedInput, ctx }) => {
    const existsLocation = await locationService.getByID(parsedInput.locationID)
    if (!existsLocation) {
      throw new ActionError('Firma lokation findes ikke i databasen')
    }
    if (existsLocation.customerID != ctx.user.customerID) {
      throw new ActionError('Firma lokation tilhører dit firma')
    }

    const newReorder = await inventoryService.updateReorderByIDs(
      parsedInput.productID,
      parsedInput.locationID,
      ctx.user.customerID,
      {
        ordered: parsedInput.ordered,
      },
    )
    if (!newReorder) {
      throw new ActionError('Minimums beholdning blev ikke opdateret')
    }

    revalidatePath('/genbestil')
  })

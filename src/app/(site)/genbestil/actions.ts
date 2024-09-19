'use server'

import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import { createReorderValidation } from './validation'

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

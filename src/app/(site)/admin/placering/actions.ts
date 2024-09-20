'use server'

import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createPlacementValidation = z.object({
  placementName: z.string().min(1, 'Placering navn er påkrævet'),
})

export const createPlacementAction = privateAction
  .schema(createPlacementValidation)
  .action(async ({ parsedInput: { placementName }, ctx }) => {
    const location = await locationService.getLastVisited(ctx.user.id)
    if (!location) {
      throw new ActionError('Kunne ikke finde din lokation')
    }
    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError('Firmakonto findes ikke i systemet')
    }

    const newPlacement = await inventoryService.createPlacement({
      name: placementName,
      locationID: location,
    })

    if (!newPlacement) {
      throw new ActionError('Placering blev ikke oprettet')
    }

    revalidatePath('/inventory')
  })

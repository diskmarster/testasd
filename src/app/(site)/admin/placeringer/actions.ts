'use server'

import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createPlacementValidation, updatePlacementValidation } from './validation'
import { PlacementID } from '@/lib/database/schema/inventory'

export const createPlacementAction = privateAction
  .schema(createPlacementValidation)
  .action(async ({ parsedInput: { name }, ctx }) => {
    const location = await locationService.getLastVisited(ctx.user.id)
    if (!location) {
      throw new ActionError('Kunne ikke finde din lokation')
    }
    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError('Firmakonto findes ikke i systemet')
    }

    const newPlacement = await inventoryService.createPlacement({
      name,
      locationID: location,
    })

    if (!newPlacement) {
      throw new ActionError('Placering blev ikke oprettet')
    }

    revalidatePath('/admin/placeringer')
  })
  export const updatePlacementAction = privateAction
  .schema(updatePlacementValidation)
  .action(async ({ parsedInput: { placementID, data: updatedPlacementData } }) => {
    const updatedPlacement = await inventoryService.updatePlacementByID(
      placementID,
      updatedPlacementData,
    )
    
    if (!updatedPlacement) {
      throw new ActionError('Der gik noget galt med at opdatere placeringen')
    }
    revalidatePath('/admin/placeringer')
    return { success: true, placement: updatedPlacement }
  })

  export async function toggleBarredPlacementAction(
    placementID: PlacementID,
    isBarred: boolean, 
  ) {
    const updatedPlacement = await inventoryService.updatePlacementBarredStatus(
      placementID,
      isBarred,
    )

    if (!updatedPlacement) {
      throw new ActionError('Der gik noget galt med at opdatere spærring på placeringen')
    }
    revalidatePath('/admin/placeringer')
    return { success: true, placement: updatedPlacement }
  }


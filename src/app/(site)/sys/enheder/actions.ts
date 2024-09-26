'use server'
import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { createUnitValidation, updateUnitValidation } from './validation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { UnitID } from '@/lib/database/schema/inventory'

export const createUnitAction = privateAction
  .schema(createUnitValidation)
  .action(async ({ parsedInput: { name }, ctx }) => {
    const { session, user } = await sessionService.validate()
    if (!session) {
      throw new ActionError('Brugeren er ikke logget ind')
    }
    const newUnit = await inventoryService.createUnit({
      name
    })
    if (!newUnit) {
      throw new ActionError('Enheden blev ikke oprettet')
    }
    revalidatePath('/sys/enheder')
    return { message: 'Enhed oprettet succesfuldt' }
  })

  export const updateUnitAction = privateAction
  .schema(updateUnitValidation)
  .action(async ({ parsedInput: { unitID, data: updatedUnitData}}) => {
    const updatedUnit = await inventoryService.updateUnitByID(
      unitID,
      updatedUnitData,
    )
    
    if (!updatedUnit) {
      throw new ActionError('Der gik noget galt med at opdatere enheden')
    }
    revalidatePath('/sys/enheder')
    return { success: true, unit: updatedUnit }
  })

  export async function toggleBarredUnitAction(
    unitID: UnitID,
    isBarred: boolean, 
  ) {
    const updatedUnit = await inventoryService.updateBarredStatus(
      unitID,
      isBarred,
    )

    if (!updatedUnit) {
      throw new ActionError('Der gik noget galt med at opdatere spærring på enheden')
    }

    revalidatePath('/sys/enheder')
    return { success: true, unit: updatedUnit }
  }
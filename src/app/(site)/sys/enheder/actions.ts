import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { revalidatePath } from 'next/cache'
import { createUnitValidation, toggleBarredUnitValidation, updateUnitValidation } from './validation'

export const createUnitAction = privateAction
  .metadata({ actionName: 'createUnit' })
  .schema(createUnitValidation)
  .action(async ({ parsedInput: { name }, ctx }) => {
    const { session, user } = await sessionService.validate()
    if (!session) {
      throw new ActionError('Brugeren er ikke logget ind')
    }
    const newUnit = await inventoryService.createUnit({
      name,
    })
    if (!newUnit) {
      throw new ActionError('Enheden blev ikke oprettet')
    }
    revalidatePath('/sys/enheder')
  })

export const updateUnitAction = privateAction
  .metadata({ actionName: 'updateUnit' })
  .schema(updateUnitValidation)
  .action(async ({ parsedInput: { unitID, data: updatedUnitData } }) => {
    const updatedUnit = await inventoryService.updateUnitByID(
      unitID,
      updatedUnitData,
    )

    if (!updatedUnit) {
      throw new ActionError('Der gik noget galt med at opdatere enheden')
    }
    revalidatePath('/sys/enheder')
  })

export const toggleBarredUnitAction = privateAction
  .metadata({ actionName: 'unitToggleBarred' })
  .schema(toggleBarredUnitValidation)
  .action(async ({ parsedInput: { unitID, isBarred } }) => {
    const updatedUnit = await inventoryService.updateUnitBarredStatus(
      unitID,
      isBarred,
    )

    if (!updatedUnit) {
      throw new ActionError(
        'Der gik noget galt med at opdatere spærring på enheden',
      )
    }

    revalidatePath('/sys/enheder')
  })

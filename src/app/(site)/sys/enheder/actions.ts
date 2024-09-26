'use server'
import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { createUnitValidation } from './validation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const createUnitAction = privateAction
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
    return { message: 'Enhed oprettet succesfuldt' }
  })

  //EDIT UNIT ACTION LATER

'use server'
import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
const createUnitValidation = z.object({
  name: z.string().min(1, 'Enhed er påkrævet'),
})
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
    revalidatePath('/units')
    return { message: 'Enhed oprettet succesfuldt' }
  })

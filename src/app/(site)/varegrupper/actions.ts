'use server'

import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createProductGroupValidation = z.object({
  name: z.string().min(1, 'Produktgruppenavn er påkrævet'),
})

export const createProductGroupAction = privateAction
  .schema(createProductGroupValidation)
  .action(async ({ parsedInput: { name }, ctx }) => {
    const { session, user } = await sessionService.validate()
    if (!session) {
      throw new ActionError('Brugeren er ikke logget ind')
    }

    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError('Firmakonto findes ikke i systemet')
    }

    const newProductGroup = await inventoryService.createProductGroup({
      name,
      customerID: customer.id,
    })

    if (!newProductGroup) {
      throw new ActionError('Produktgruppen blev ikke oprettet')
    }

    revalidatePath('/product-groups')

    return { message: 'Produktgruppe oprettet succesfuldt' }
  })

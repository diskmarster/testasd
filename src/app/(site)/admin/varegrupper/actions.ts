'use server'

import { GroupID } from '@/lib/database/schema/inventory'
import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { revalidatePath } from 'next/cache'
import { createGroupValidation, updateGroupValidation } from './validation'

export const createGroupAction = privateAction
  .schema(createGroupValidation)
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

    revalidatePath('/admin/varegrupper')
  })

export const updateGroupAction = privateAction
  .schema(updateGroupValidation)
  .action(async ({ parsedInput: { groupID, data: updatedGroupData } }) => {
    const updatedGroup = await inventoryService.updateGroupByID(
      groupID,
      updatedGroupData,
    )
    if (!updatedGroup) {
      throw new ActionError('Der gik noget galt med at opdatere varegruppen')
    }
    revalidatePath('/admin/varegrupper')
  })

export async function toggleBarredGroupAction(
  groupID: GroupID,
  isBarred: boolean,
) {
  const updatedGroup = await inventoryService.updateGroupBarredStatus(
    groupID,
    isBarred,
  )
  if (!updatedGroup) {
    throw new ActionError(
      'Der gik noget galt med at opdaterer spærring på varegruppen',
    )
  }
  revalidatePath('/admin/varegrupper')
}

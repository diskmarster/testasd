'use server'

import { serverTranslation } from '@/app/i18n'
import { privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { revalidatePath } from 'next/cache'
import {
  createGroupValidation,
  groupToggleBarredValidation,
  updateGroupValidation,
} from './validation'

export const createGroupAction = privateAction
  .metadata({ actionName: 'createGroup' })
  .schema(createGroupValidation)
  .action(async ({ parsedInput: { name }, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const { session, user } = await sessionService.validate()
    if (!session) {
      throw new ActionError(t('product-group-action.user-not-logged-in'))
    }

    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError(t('product-group-action.company-not-found'))
    }

    const newProductGroup = await inventoryService.createProductGroup(
      {
        name,
        customerID: customer.id,
      },
      ctx.lang,
    )

    if (!newProductGroup) {
      throw new ActionError(t('product-group-action.product-group-not-created'))
    }

    revalidatePath(`/${ctx.lang}/admin/varegrupper`)
  })

export const updateGroupAction = privateAction
  .metadata({ actionName: 'updateGroup' })
  .schema(updateGroupValidation)
  .action(async ({ parsedInput: { groupID, data: updatedGroupData }, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const updatedGroup = await inventoryService.updateGroupByID(
      groupID,
      updatedGroupData,
      ctx.lang,
    )
    if (!updatedGroup) {
      throw new ActionError(t('product-group-action.product-group-not-updated'))
    }
    revalidatePath(`/${ctx.lang}/admin/varegrupper`)
  })

export const toggleBarredGroupAction = privateAction
  .metadata({ actionName: 'groupToggleBarred' })
  .schema(groupToggleBarredValidation)
  .action(async ({ parsedInput: { groupID, isBarred }, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const updatedGroup = await inventoryService.updateGroupBarredStatus(
      groupID,
      isBarred,
    )
    if (!updatedGroup) {
      throw new ActionError(
        t('product-group-action.product-group-not-updated-barred'),
      )
    }
    revalidatePath(`/${ctx.lang}/admin/varegrupper`)
  })

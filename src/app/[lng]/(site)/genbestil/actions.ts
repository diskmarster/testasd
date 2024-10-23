'use server'

import { serverTranslation } from '@/app/i18n'
import { editableAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import {
  addOrderedToReorderValidation,
  createReorderValidation,
  deleteReorderValidation,
  updateReorderValidation,
} from './validation'

export const createReorderAction = editableAction
  .metadata({ actionName: 'createReorder' })
  .schema(createReorderValidation)
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const existsLocation = await locationService.getByID(parsedInput.locationID)
    if (!existsLocation) {
      throw new ActionError(t('restock-action.company-location-not-found'))
    }
    if (existsLocation.customerID != ctx.user.customerID) {
      throw new ActionError(
        t('restock-action.company-location-belongs-to-your-company'),
      )
    }

    const newReorder = await inventoryService.createReorder({
      ...parsedInput,
      customerID: ctx.user.customerID,
    })
    if (!newReorder) {
      throw new ActionError(t('minimum-stock-action.minimum-stock-not-created'))
    }

    revalidatePath(`/${ctx.lang}/genbestil`)
  })

export const updateReorderAction = editableAction
  .metadata({ actionName: 'updateReorder' })
  .schema(updateReorderValidation)
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const existsLocation = await locationService.getByID(parsedInput.locationID)
    if (!existsLocation) {
      throw new ActionError(t('restock-action.company-location-not-found'))
    }
    if (existsLocation.customerID != ctx.user.customerID) {
      throw new ActionError(
        t('restock-action.company-location-belongs-to-your-company'),
      )
    }

    const newReorder = await inventoryService.updateReorderByIDs(
      parsedInput.productID,
      parsedInput.locationID,
      ctx.user.customerID,
      {
        minimum: parsedInput.minimum,
        buffer: parsedInput.buffer / 100,
      },
    )
    if (!newReorder) {
      throw new ActionError(t('minimum-stock-action.minimum-stock-not-updated'))
    }

    revalidatePath(`/${ctx.lang}/genbestil`)
  })

export const deleteReorderAction = editableAction
  .metadata({ actionName: 'deleteReorder' })
  .schema(deleteReorderValidation)
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const existsLocation = await locationService.getByID(parsedInput.locationID)
    if (!existsLocation) {
      throw new ActionError(t('restock-action.company-location-not-found'))
    }
    if (existsLocation.customerID != ctx.user.customerID) {
      throw new ActionError(
        t('restock-action.company-location-belongs-to-your-company'),
      )
    }

    const didDelete = await inventoryService.deleteReorderByIDs(
      parsedInput.productID,
      parsedInput.locationID,
      ctx.user.customerID,
    )
    if (!didDelete) {
      throw new ActionError(t('minimum-stock-action.minimum-stock-not-deleted'))
    }

    revalidatePath(`/${ctx.lang}/genbestil`)
  })

export const addOrderedToReorderAction = editableAction
  .metadata({ actionName: 'addOrderedToReorderAction' })
  .schema(addOrderedToReorderValidation)
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const existsLocation = await locationService.getByID(parsedInput.locationID)
    if (!existsLocation) {
      throw new ActionError(t('restock-action.company-location-not-found'))
    }
    if (existsLocation.customerID != ctx.user.customerID) {
      throw new ActionError(
        t('restock-action.company-location-belongs-to-your-company'),
      )
    }

    const newReorder = await inventoryService.updateReorderByIDs(
      parsedInput.productID,
      parsedInput.locationID,
      ctx.user.customerID,
      {
        ordered: parsedInput.ordered,
      },
    )
    if (!newReorder) {
      throw new ActionError(t('minimum-stock-action.minimum-stock-not-updated'))
    }

    revalidatePath(`/${ctx.lang}/genbestil`)
  })

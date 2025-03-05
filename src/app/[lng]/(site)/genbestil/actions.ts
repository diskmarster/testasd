'use server'

import { serverTranslation } from '@/app/i18n'
import { editableAction, getSchema } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import {
  addOrderedToReorderValidation,
  bulkAddOrderedToReorderValidation,
  createReorderValidation,
  deleteReorderValidation,
  updateReorderValidation,
} from './validation'

export const createReorderAction = editableAction
  .metadata({ actionName: 'createReorder' })
  .schema(async () => await getSchema(createReorderValidation, 'validation'))
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
		const locationID = await locationService.getLastVisited(ctx.user.id)
    if (!locationID) {
      throw new ActionError(t('restock-action.company-location-not-found'))
    }
    const existsLocation = await locationService.getByID(locationID)
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
			locationID: existsLocation.id,
      customerID: ctx.user.customerID,
    })
    if (!newReorder) {
      throw new ActionError(t('minimum-stock-action.minimum-stock-not-created'))
    }

    revalidatePath(`/${ctx.lang}/genbestil`)
  })

export const updateReorderAction = editableAction
  .metadata({ actionName: 'updateReorder' })
  .schema(async () => await getSchema(updateReorderValidation, 'validation'))
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')

    const locationID = await locationService.getLastVisited(ctx.user.id)
    if (!locationID) {
      throw new ActionError(t('restock-action.company-location-not-found'))
    }
    const existsLocation = await locationService.getByID(locationID)
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
      locationID,
      ctx.user.customerID,
      {
        minimum: parsedInput.minimum,
				orderAmount: parsedInput.orderAmount,
				maxOrderAmount: parsedInput.maxOrderAmount,
      },
    )
    if (!newReorder) {
      throw new ActionError(t('minimum-stock-action.minimum-stock-not-updated'))
    }

    revalidatePath(`/${ctx.lang}/genbestil`)
  })

export const deleteReorderAction = editableAction
  .metadata({ actionName: 'deleteReorder' })
  .schema(async () => await getSchema(deleteReorderValidation, 'validation'))
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
  .schema(
    async () => await getSchema(addOrderedToReorderValidation, 'validation'),
  )
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

export const bulkAddOrderedToReorderAction = editableAction
  .metadata({ actionName: 'bulkAddOrderedToReorderAction' })
  .schema(
    async () => await getSchema(bulkAddOrderedToReorderValidation, 'genbestil'),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
		const locationID = await locationService.getLastVisited(ctx.user.id)
    if (!locationID) {
      throw new ActionError(t('restock-action.company-location-not-found'))
    }
    const existsLocation = await locationService.getByID(locationID)
    if (!existsLocation) {
      throw new ActionError(t('restock-action.company-location-not-found'))
    }
    if (existsLocation.customerID != ctx.user.customerID) {
      throw new ActionError(
        t('restock-action.company-location-belongs-to-your-company'),
      )
    }

    const promises = []

    for (const reorder of parsedInput.items) {
      const addPromise = inventoryService.updateReorderByIDs(
        reorder.productID,
        locationID,
        ctx.user.customerID,
        {
          ordered: reorder.ordered + reorder.alreadyOrdered,
        },
      )
      promises.push(addPromise)
    }

    await Promise.all(promises)

    revalidatePath(`/${ctx.lang}/genbestil`)
  })

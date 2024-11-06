'use server'

import { serverTranslation } from '@/app/i18n'
import { editableAction, getSchema } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import {
  createPlacementValidation,
  toggleBarredPlacementValidation,
  updatePlacementValidation,
} from './validation'

export const createPlacementAction = editableAction
  .metadata({ actionName: 'createPlacement' })
  .schema(async () => await getSchema(createPlacementValidation, 'validation'))
  .action(async ({ parsedInput: { name }, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const location = await locationService.getLastVisited(ctx.user.id)
    if (!location) {
      throw new ActionError(t('placement-action.location-not-found'))
    }
    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError(t('placement-action.customer-not-found'))
    }

    const newPlacement = await inventoryService.createPlacement(
      {
        name,
        locationID: location,
      },
      ctx.lang,
    )

    if (!newPlacement) {
      throw new ActionError(t('placement-action.placement-not-created'))
    }

    revalidatePath(`/${ctx.lang}/admin/placeringer`)
  })

export const updatePlacementAction = editableAction
  .metadata({ actionName: 'updatePlacement' })
  .schema(async () => await getSchema(updatePlacementValidation, 'validation'))
  .action(
    async ({
      parsedInput: { placementID, data: updatedPlacementData },
      ctx,
    }) => {
      const { t } = await serverTranslation(ctx.lang, 'action-errors')
      const updatedPlacement = await inventoryService.updatePlacementByID(
        placementID,
        updatedPlacementData,
      )

      if (!updatedPlacement) {
        throw new ActionError(t('placement-action.placement-not-updated'))
      }
      revalidatePath(`/${ctx.lang}/admin/placeringer`)
    },
  )

export const toggleBarredPlacementAction = editableAction
  .metadata({ actionName: 'placementToggleBarred' })
  .schema(
    async () => await getSchema(toggleBarredPlacementValidation, 'validation'),
  )
  .action(async ({ parsedInput: { placementID, isBarred }, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const updatedPlacement = await inventoryService.updatePlacementBarredStatus(
      placementID,
      isBarred,
    )

    if (!updatedPlacement) {
      throw new ActionError(t('placement-action.placement-not-updated-barred'))
    }
    revalidatePath(`/${ctx.lang}/admin/placeringer`)
  })

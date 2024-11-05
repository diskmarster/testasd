'use server'

import { serverTranslation } from '@/app/i18n'
import { editableAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { t } from 'i18next'
import { revalidatePath } from 'next/cache'
import {
  createUnitValidation,
  toggleBarredUnitValidation,
  updateUnitValidation,
} from './validation'

export const createUnitAction = editableAction
  .metadata({ actionName: 'createUnit' })
  .schema(createUnitValidation)
  .action(async ({ parsedInput: { name }, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const { session, user } = await sessionService.validate()
    if (!session) {
      throw new ActionError(t('unit-action.user-not-logged-in'))
    }
    const newUnit = await inventoryService.createUnit(
      {
        name,
      },
      ctx.lang,
    )
    if (!newUnit) {
      throw new ActionError(t('unit-action.unit-not-created'))
    }
    revalidatePath(`/${ctx.lang}/sys/enheder`)
  })

export const updateUnitAction = editableAction
  .metadata({ actionName: 'updateUnit' })
  .schema(updateUnitValidation)
  .action(async ({ parsedInput: { unitID, data: updatedUnitData }, ctx }) => {
    const updatedUnit = await inventoryService.updateUnitByID(
      unitID,
      updatedUnitData,
    )

    if (!updatedUnit) {
      throw new ActionError(t('unit-action.unit-not-updated'))
    }
    revalidatePath(`/${ctx.lang}/sys/enheder`)
  })

export const toggleBarredUnitAction = editableAction
  .metadata({ actionName: 'unitToggleBarred' })
  .schema(toggleBarredUnitValidation)
  .action(async ({ parsedInput: { unitID, isBarred } }) => {
    const updatedUnit = await inventoryService.updateUnitBarredStatus(
      unitID,
      isBarred,
    )

    if (!updatedUnit) {
      throw new ActionError(t('unit-action.unit-not-barred'))
    }

    revalidatePath('/sys/enheder')
  })

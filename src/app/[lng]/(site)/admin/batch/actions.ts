'use server'

import { serverTranslation } from '@/app/i18n'
import { authedAction, editableAction, getSchema } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import {
  createBatchValidation,
  toggleBarredBatchValidation,
  updateBatchValidation,
} from './validation'

export const createBatchAction = authedAction
  .schema(async () => await getSchema(createBatchValidation, 'validation'))
  .action(async ({ parsedInput: { batchName, expiry }, ctx }) => {
    const location = await locationService.getLastVisited(ctx.user.id)
    const { t } = await serverTranslation(ctx.lang, 'action-errors')

    if (!location) {
      throw new ActionError(t('batch-actions.couldnt-find-location'))
    }
    const customer = await customerService.getByID(ctx.user.customerID)
    if (!customer) {
      throw new ActionError(t('batch-actions.account-doesnt-exist'))
    }

    const newBatch = await inventoryService.createBatch({
      batch: batchName,
      locationID: location,
      expiry: expiry,
    })

    if (!newBatch) {
      throw new ActionError(t('batch-actions.batch-not-created'))
    }

    revalidatePath(`${ctx.lang}/admin/batch`)
  })

export const updateBatchAction = editableAction
  .metadata({ actionName: 'updateBatch' })
  .schema(async () => await getSchema(updateBatchValidation, 'validation'))
  .action(async ({ parsedInput: { batchID, data: updatedBatchData }, ctx }) => {
    const updatedBatch = await inventoryService.updateBatchByID(
      batchID,
      updatedBatchData,
    )
    const { t } = await serverTranslation(ctx.lang, 'action-errors')

    if (!updatedBatch) {
      throw new ActionError(t('batch-actions.batch-not-updated'))
    }

    revalidatePath(`${ctx.lang}/admin/batch`)
  })

export const toggleBarredBatchAction = editableAction
  .metadata({ actionName: 'batchToggleBarred' })
  .schema(
    async () => await getSchema(toggleBarredBatchValidation, 'validation'),
  )
  .action(async ({ parsedInput: { batchID, isBarred }, ctx }) => {
    const updatedBatch = await inventoryService.updateBatchBarredStatus(
      batchID,
      isBarred,
    )
    const { t } = await serverTranslation(ctx.lang, 'action-errors')

    if (!updatedBatch) {
      throw new ActionError(t('batch-actions.batch-not-updated'))
    }
    revalidatePath(`${ctx.lang}/admin/batch`)
  })

'use server'

import { serverTranslation } from '@/app/i18n'
import { genReorderExcelWorkbook } from '@/lib/pdf/reorder-rapport'
import { editableAction, getSchema } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { formatDate } from '@/lib/utils'
import { attachmentService } from '@/service/attachments'
import { fileService } from '@/service/file'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { ordersService } from '@/service/orders'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import * as XLSX from 'xlsx'
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
    const { t: reorderT } = await serverTranslation(ctx.lang, 'genbestil')
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
      if (!reorder.isRequested) {
        const addPromise = inventoryService.updateReorderByIDs(
          reorder.productID,
          locationID,
          ctx.user.customerID,
          {
            ordered: reorder.ordered + reorder.alreadyOrdered,
          },
        )
        promises.push(addPromise)
      } else {
        const deletePromise = inventoryService.deleteReorderByIDs(
          reorder.productID,
          locationID,
          ctx.user.customerID,
        )
        promises.push(deletePromise)
      }
    }

    const newOrder = {
      meta: {
        customerID: ctx.user.customerID,
        locationID: locationID,
        userID: ctx.user.id,
        userName: ctx.user.name,
      },
      lines: [
        ...parsedInput.items.map(i => ({
          customerID: ctx.user.customerID,
          locationID: locationID,
          productID: i.productID,
          supplierName: i.supplierName ?? '-',
          sku: i.sku,
          barcode: i.barcode,
          text1: i.text1,
          text2: i.text2,
          unitName: i.unitName,
          costPrice: i.costPrice,
          quantity: i.ordered,
          sum: i.ordered * i.costPrice,
        })),
      ],
    }

    const orderID = await ordersService.create(newOrder.meta, newOrder.lines)

    const workbook = genReorderExcelWorkbook(newOrder.lines, reorderT)
    const arr = XLSX.write(workbook, { type: 'array' })
    const fileInfo = fileService.validate({
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      customerID: ctx.user.customerID,
      refType: 'genbestil',
      refID: orderID,
    })
    if (fileInfo.success) {
      promises.push(
        fileService.upload({
          key: fileInfo.key,
          mimeType: fileInfo.type,
          body: arr,
        }),
      )
      promises.push(
        attachmentService.create({
          customerID: ctx.user.customerID,
          refDomain: 'genbestil',
          refID: orderID,
          name: `nemlager_genbestilling_${formatDate(new Date())}`,
          type: fileInfo.type,
          key: fileInfo.key,
          url: fileInfo.url,
          userID: ctx.user.id,
          userName: ctx.user.name,
        }),
      )
    }

    await Promise.all(promises)

    redirect(`/${ctx.lang}/genbestil/${orderID}`)
  })

export const fetchOrdersActions = editableAction
  .metadata({ actionName: 'fetchOrders' })
  .action(async ({ ctx: { user, lang } }) => {
    const { t } = await serverTranslation(lang, 'action-errors')

    const locationID = await locationService.getLastVisited(user.id)
    if (!locationID) {
      throw new ActionError(t('restock-action.company-location-not-found'))
    }

    const existsLocation = await locationService.getByID(locationID)
    if (!existsLocation) {
      throw new ActionError(t('restock-action.company-location-not-found'))
    }

    if (existsLocation.customerID != user.customerID) {
      throw new ActionError(
        t('restock-action.company-location-belongs-to-your-company'),
      )
    }

    return await ordersService.getAll(user.customerID, locationID)
  })

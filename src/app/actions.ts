'use server'

import { HistoryFilter, HistoryType, historyTypeZodSchema } from '@/data/inventory.types'
import { adminAction, authedAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const changeLocationValidation = z.object({
  locationID: z.string(),
  revalidatePath: z.string(),
})

export const changeLocationAction = authedAction
  .metadata({ actionName: 'changeLocation' })
  .schema(changeLocationValidation)
  .action(async ({ parsedInput }) => {
    locationService.setCookie(parsedInput.locationID)
    revalidatePath(parsedInput.revalidatePath)
  })

export const refreshTableAction = authedAction
  .schema(z.object({ pathName: z.string() }))
  .action(async ({ parsedInput }) => {
    revalidatePath(parsedInput.pathName)
  })

export const genInventoryReportAction = adminAction
  .schema(
    z.object({
      locationID: z.string(),
    }),
  )
  .action(async ({ parsedInput: { locationID }, ctx: { user } }) => {
    const [customer, inventory, location] = await Promise.all([
      customerService.getByID(user.customerID),
      inventoryService.getInventory(locationID),
      locationService.getByID(locationID),
    ])

    if (!customer) throw new ActionError('firma blev ikke fundet')
    if (!location) throw new ActionError('lokation blev ikke fundet')

    return {
      customer,
      location,
      inventory,
    }
  })

export const genInventoryMovementsReportAction = adminAction
  .schema(
    z.object({
      locationID: z.string(),
      itemGroup: z.array(z.string()),
      dateRange: z.object({
        from: z.coerce.date(),
        to: z.coerce.date(),
      }),
			type: z.array(z.literal('all').or(historyTypeZodSchema))
    }),
  )
  .action(
    async ({
      parsedInput: { locationID, dateRange, itemGroup, type },
      ctx: { user },
    }) => {
      let historyFilter: HistoryFilter = {
        date: dateRange,
      }
      if (!itemGroup.includes('all')) {
        historyFilter.group = itemGroup
      }
			if (!type.includes('all')) {
				historyFilter.type = type as HistoryType[]
			}

      const [customer, history, location] = await Promise.all([
        customerService.getByID(user.customerID),
        inventoryService.getHistoryByLocationID(locationID, historyFilter),
        locationService.getByID(locationID),
      ])

      if (!customer) throw new ActionError('firma blev ikke fundet')
      if (!location) throw new ActionError('lokation blev ikke fundet')

      return {
        customer,
        location,
        history,
      }
    },
  )

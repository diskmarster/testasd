'use server'

import { editableAction } from '@/lib/safe-action'
import { locationService } from '@/service/location'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const changeLocationValidation = z.object({
  locationID: z.string(),
  revalidatePath: z.string(),
})

export const changeLocationAction = editableAction
  .metadata({ actionName: 'changeLocation' })
  .schema(changeLocationValidation)
  .action(async ({ parsedInput }) => {
    locationService.setCookie(parsedInput.locationID)
    revalidatePath(parsedInput.revalidatePath)
  })

export const refreshTableAction = editableAction
  .schema(z.object({ pathName: z.string() }))
  .action(async ({ parsedInput }) => {
    revalidatePath(parsedInput.pathName)
  })

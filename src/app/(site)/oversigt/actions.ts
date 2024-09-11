'use server'

import { privateAction } from '@/lib/safe-action'
import { updateInventoryValidation } from './validation'

export const updateInventoryAction = privateAction
  .schema(updateInventoryValidation)
  .action(async ({ parsedInput, ctx }) => {
    console.log(parsedInput)
  })

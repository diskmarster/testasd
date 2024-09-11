'use server'

import { adminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { productService } from '@/service/products'
import { createProductValidation } from './validation'

export const createProductAction = adminAction
  .schema(createProductValidation)
  .action(async ({ parsedInput }) => {
    const newProduct = await productService.create(parsedInput)
    if (!newProduct) {
      throw new ActionError('Der gik noget galt med at oprette produktet')
    }
  })

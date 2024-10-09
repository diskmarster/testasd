'use server'

import { adminAction, privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { productService } from '@/service/products'
import { revalidatePath } from 'next/cache'
import {
  createProductValidation,
  importProductsValidation,
  productToggleBarredValidation,
  updateProductValidation,
} from './validation'

export const createProductAction = privateAction
  .metadata({ actionName: 'createProduct' })
  .schema(createProductValidation)
  .action(async ({ parsedInput, ctx }) => {
    const newProduct = await productService.create(
      parsedInput,
      ctx.user.customerID,
      ctx.user.id,
    )
    if (!newProduct) {
      throw new ActionError('Der gik noget galt med at oprette produktet')
    }
    revalidatePath('/admin/produkter')
  })

export const updateProductAction = privateAction
  .metadata({ actionName: 'updateProduct' })
  .schema(updateProductValidation)
  .action(
    async ({
      ctx: { user },
      parsedInput: { productID, data: updatedProductData },
    }) => {
      const updatedProduct = await productService.updateByID(
        productID,
        updatedProductData,
        user.id,
      )

      if (!updatedProduct) {
        throw new ActionError('Der gik noget galt med at opdatere produktet')
      }

      revalidatePath('/admin/produkter')
    },
  )

export const toggleBarredProductAction = privateAction
  .metadata({ actionName: 'productToggleBarred' })
  .schema(productToggleBarredValidation)
  .action(async ({ parsedInput: { productID, isBarred }, ctx: { user } }) => {
    const updatedProduct = await productService.updateBarredStatus(
      productID,
      isBarred,
      user.id,
    )

    if (!updatedProduct) {
      throw new ActionError(
        'Der gik noget galt med at opdatere spærring statusen.',
      )
    }

    revalidatePath('/admin/produkter')
  })

export const importProductsAction = adminAction
  .schema(importProductsValidation)
  .action(async ({ parsedInput: importedData, ctx }) => {
    const didImport = await productService.importProducts(
      ctx.user.customerID,
      ctx.user.id,
      importedData,
    )

    revalidatePath('/admin/produkter')
  })

export const finishProductsAction = adminAction
  .metadata({ actionName: 'importProductAction' })
  .action(async ({ ctx }) => {
    console.log(
      `imported products finished for ${ctx.user.customerID} by ${ctx.user.name}`,
    )
  })

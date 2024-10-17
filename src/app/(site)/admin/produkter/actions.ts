'use server'

import { ProductID } from '@/lib/database/schema/inventory'
import { adminAction, privateAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { productService } from '@/service/products'
import { revalidatePath } from 'next/cache'
import { createProductValidation, importProductsValidation, updateProductValidation } from './validation'
import { chunkArray } from '@/lib/utils'

export const createProductAction = privateAction
  .metadata({actionName: 'createProduct'})
  .schema(createProductValidation)
  .action(async ({ parsedInput, ctx }) => {
    const newProduct = await productService.create(
      parsedInput,
      ctx.user.customerID,
    )
    if (!newProduct) {
      throw new ActionError('Der gik noget galt med at oprette produktet')
    }
    revalidatePath('/admin/produkter')
  })

export const updateProductAction = privateAction
  .metadata({actionName: 'updateProduct'})
  .schema(updateProductValidation)
  .action(async ({ parsedInput: { productID, data: updatedProductData } }) => {
    const updatedProduct = await productService.updateByID(
      productID,
      updatedProductData,
    )

    if (!updatedProduct) {
      throw new ActionError('Der gik noget galt med at opdatere produktet')
    }

    revalidatePath('/admin/produkter')
  })

export async function toggleBarredProductAction(
  productID: ProductID,
  isBarred: boolean,
) {
  const updatedProduct = await productService.updateBarredStatus(
    productID,
    isBarred,
  )

  if (!updatedProduct) {
    throw new ActionError(
      'Der gik noget galt med at opdatere spærring statusen.',
    )
  }

  revalidatePath('/admin/produkter')
}

export const importProductsAction = adminAction
  .schema(importProductsValidation)
  .action(async ({parsedInput: importedData, ctx}) => {

  const didImport = await productService.importProducts(
    ctx.user.customerID,
    importedData
  )

  revalidatePath("/admin/produkter")
})


export const finishProductsAction = adminAction
  .metadata({actionName: "importProductAction"})
  .action(async ({ctx}) => {
    console.log(`imported products finished for ${ctx.user.customerID} by ${ctx.user.name}`) 
})

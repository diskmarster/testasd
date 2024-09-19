'use server'

import { PartialProduct, ProductID } from '@/lib/database/schema/inventory'
import { adminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { productService } from '@/service/products'
import { revalidatePath } from 'next/cache'
import { createProductValidation } from './validation'

export const createProductAction = adminAction
  .schema(createProductValidation)
  .action(async ({ parsedInput }) => {
    const newProduct = await productService.create(parsedInput)
    if (!newProduct) {
      throw new ActionError('Der gik noget galt med at oprette produktet')
    }
    revalidatePath('/admin/produkter')
  })

export async function updateProductAction(
  productID: ProductID,
  updatedProductData: PartialProduct,
) {
  try {
    const updatedProduct = await productService.updateByID(
      productID,
      updatedProductData,
    )
    if (!updatedProduct) {
      throw new Error('Failed to update the product')
    }
    revalidatePath('/admin/produkter')
    return { success: true, product: updatedProduct }
  } catch (err: any) {
    console.error('Error updating product:', err)
    return { success: false, serverError: err.message }
  }
}



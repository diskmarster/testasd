'use server'

import { ProductID } from '@/lib/database/schema/inventory'
import { adminAction } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { productService } from '@/service/products'
import { revalidatePath } from 'next/cache'
import { createProductValidation, updateProductValidation } from './validation'

export const createProductAction = adminAction
  .schema(createProductValidation)
  .action(async ({ parsedInput }) => {
    const newProduct = await productService.create(parsedInput)
    if (!newProduct) {
      throw new ActionError('Der gik noget galt med at oprette produktet')
    }
    revalidatePath('/admin/produkter')
  })

  export const updateProductAction = adminAction
  .schema(updateProductValidation)
  .action(async ({ parsedInput: { productID, data: updatedProductData } }) => {
    const updatedProduct = await productService.updateByID(
      productID,
      updatedProductData,
    );

    if (!updatedProduct) {
      throw new ActionError('Der gik noget galt med at opdatere produktet');
    }

    revalidatePath('/admin/produkter');
    return { success: true, product: updatedProduct };
  });

  export async function toggleBarredProductAction(
    productID: ProductID,
    isBarred: boolean,
  ) {
    const updatedProduct = await productService.updateBarredStatus(
      productID,
      isBarred,
    );
  
    if (!updatedProduct) {
      throw new ActionError('Der gik noget galt med at opdatere spærring statusen.');
    }
  
    revalidatePath('/admin/produkter');
    return { success: true, product: updatedProduct };
  }
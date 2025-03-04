'use server'

import { serverTranslation } from '@/app/i18n'
import { adminAction, editableAction, getSchema } from '@/lib/safe-action'
import { ActionError } from '@/lib/safe-action/error'
import { productService } from '@/service/products'
import { revalidatePath } from 'next/cache'
import {
  createProductValidation,
  importProductsValidation,
  productToggleBarredValidation,
  updateProductValidation,
} from './validation'

export const createProductAction = editableAction
  .metadata({ actionName: 'createProduct' })
  .schema(async () => await getSchema(createProductValidation, 'validation'))
  .action(async ({ parsedInput, ctx }) => {
    const { t } = await serverTranslation(ctx.lang, 'action-errors')
    const newProduct = await productService.create(
      parsedInput,
      ctx.user.customerID,
      ctx.user.id,
      ctx.lang,
    )
    if (!newProduct) {
      throw new ActionError(t('product-action.product-not-created'))
    }
    revalidatePath(`/${ctx.lang}/varer/produkter`)
  })

export const updateProductAction = editableAction
  .metadata({ actionName: 'updateProduct' })
  .schema(async () => await getSchema(updateProductValidation, 'validation'))
  .action(
    async ({
      ctx: { user, lang },
      parsedInput: { productID, data: updatedProductData },
    }) => {
      const { t } = await serverTranslation(lang, 'action-errors')
	  if (updatedProductData.supplierID == -1) {
		  updatedProductData.supplierID = null
	  }
      const updatedProduct = await productService.updateByID(
        productID,
        updatedProductData,
        user.id,
      )

      if (!updatedProduct) {
        throw new ActionError(t('product-action.product-not-updated'))
      }
    },
  )

export const toggleBarredProductAction = editableAction
  .metadata({ actionName: 'productToggleBarred' })
  .schema(productToggleBarredValidation)
  .action(
    async ({ parsedInput: { productID, isBarred }, ctx: { user, lang } }) => {
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

      revalidatePath(`/${lang}/varer/produkter`)
    },
  )

export const importProductsAction = adminAction
  .metadata({ actionName: 'importProducts', excludeAnalytics: true })
  .schema(importProductsValidation)
  .action(async ({ parsedInput: importedData, ctx }) => {
    const didImport = await productService.importProducts(
      ctx.user.customerID,
      ctx.user.id,
      importedData,
    )

    revalidatePath(`/${ctx.lang}/varer/produkter`)
  })

export const finishProductsAction = adminAction
  .metadata({ actionName: 'importProductAction' })
  .action(async ({ ctx }) => {
    console.log(
      `imported products finished for ${ctx.user.customerID} by ${ctx.user.name}`,
    )
  })

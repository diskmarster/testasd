import { z } from 'zod'

export const createReorderValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    productID: z.coerce.number({
      message: t('restock.product-required'),
    }),
    locationID: z.string().min(1),
    buffer: z.coerce
      .number()
      .positive({ message: t('restock.buffer-positive') }),
    minimum: z.coerce.number().refine(val => !isNaN(val) && val > 0, {
      message: t('restock.minimum-quantity-positive'),
    }),
  })
export const updateReorderValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    productID: z.coerce.number({
      message: t('restock.product-required'),
    }),
    locationID: z.string().min(1),
    buffer: z.coerce
      .number()
      .positive({ message: t('restock.buffer-positive') }),
    minimum: z.coerce.number().refine(val => !isNaN(val) && val > 0, {
      message: t('restock.minimum-quantity-positive'),
    }),
  })

export const deleteReorderValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    productID: z.coerce.number({ message: t('restock.product-required') }),
    locationID: z.string().min(1),
  })

export const addOrderedToReorderValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    productID: z.coerce.number({ message: t('restock.product.required') }),
    locationID: z.string().min(1),
    ordered: z.coerce
      .number()
      .positive({ message: t('restock.ordered-quantity-positive') }),
  })

export const bulkAddOrderedToReorderValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    locationID: z.string(),
    items: z.array(
      z.object({
        text1: z.string(),
        sku: z.string(),
        productID: z.coerce.number(),
        amount: z.coerce
          .number()
          .positive({ message: t('bulk.errors.positive') }),
      }),
    ),
  })

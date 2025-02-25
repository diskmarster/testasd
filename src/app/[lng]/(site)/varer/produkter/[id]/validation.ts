import { z } from 'zod'

export const updateProductValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    productID: z.coerce.number(),
    data: z.object({
      customerID: z.coerce.number(),
      groupID: z.coerce.number(),
      unitID: z.coerce.number(),
      supplierID: z.coerce.number().nullable(),
      text1: z
        .string()
        .min(1, t('products.product-text-required'))
        .max(255, t('products.product1-max-length', { num: 255 })),
      text2: z
        .string()
        .max(255, t('products.product2-max-length', { num: 255 })),
      text3: z
        .string()
        .max(1000, t('products.product3-max-length', { num: 1000 })),
      sku: z
        .string()
        .min(1, t('products.sku-required'))
        .max(25, t('products.sku-max-length', { num: 25 })),
      barcode: z.string().min(1, t('products.barcode-required')),
      costPrice: z.coerce.number(),
      salesPrice: z.coerce.number(),
    }),
  })

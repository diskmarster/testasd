import { units } from '@/data/products.types'
import { convertENotationToNumber } from '@/lib/utils'
import { z } from 'zod'

export const createProductValidation = (
  t: (key: string, options?: any) => string,
) =>
  z
    .object({
      customerID: z.coerce.number(),
      groupID: z.coerce.number(),
      unitID: z.coerce.number(),
      text1: z.string().min(1, t('products.product-text-required')),
      text2: z.string(),
      text3: z.string(),
      sku: z.string().min(1, t('products.sku-required')),
      barcode: z.string().min(1, t('products.barcode-required')),
      costPrice: z.coerce.number(),
      salesPrice: z.coerce.number(),
    })
    .superRefine((val, ctx) => {
      if (val.costPrice < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['costPrice'],
          message: t('products.cost-price-negative'),
        })
      }

      if (val.costPrice == undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['costPrice'],
          message: t('products.cost-price-required'),
        })
      }
    })
export const updateProductValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    productID: z.coerce.number(),
    data: z.object({
      customerID: z.coerce.number(),
      groupID: z.coerce.number(),
      unitID: z.coerce.number(),
      text1: z.string().min(1, t('products.product-text-required')),
      text2: z.string(),
      text3: z.string(),
      sku: z.string().min(1, t('products.sku-required')),
      barcode: z.string().min(1, t('products.barcode-required')),
      costPrice: z.coerce.number(),
      salesPrice: z.coerce.number(),
    }),
  })

export const productToggleBarredValidation = z.object({
  productID: z.coerce.number(),
  isBarred: z.coerce.boolean(),
})

export const productsDataValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.array(
    z
      .object({
        sku: z.preprocess(
          // @ts-ignore
          val => val.toString().toUpperCase(),
          z.coerce
            .string({ required_error: t('products.sku-required') })
            .min(1, { message: t('products.sku-preprocess') }),
        ),
        barcode: z.preprocess(
          val => {
            if (typeof val == 'string') {
              return convertENotationToNumber(val).toUpperCase()
            } else {
              return val
            }
          },
          z.coerce
            .string({ required_error: t('products.barcode-required') })
            .min(1, { message: t('products.barcode-preprocess') }),
        ),
        group: z.coerce
          .string({ required_error: t('products.product-group-required') })
          .min(1, { message: t('products.product-group-preprocess') }),
        unit: z.preprocess(
          //@ts-ignore - string is not the same as the value in units bla bla shut up typescript
          (val: string) => val.trim().toLowerCase(),
          z.enum(units, {
            invalid_type_error: `${t('products.unit-preprocess-unknown-type')} ${units.join(', ')}`,
            message: `${t('products.unit-preprocess-unknown-type')} ${units.join(', ')}`,
          }),
        ),
        text1: z.preprocess(
          // @ts-ignore
          val => val.toString(),
          z
            .string({ required_error: t('products.product-text-required') })
            .min(1, {
              message: t('products.product-text-preprocess'),
            }),
        ),
        text2: z.preprocess(
          // @ts-ignore
          val => val.toString(),
          z.string().optional().default(''),
        ),
        text3: z.preprocess(
          // @ts-ignore
          val => val.toString(),
          z.string().optional().default(''),
        ),
        costPrice: z.coerce
          .number({
            invalid_type_error: t('products.cost-price-type'),
          })
          .default(0),
        salesPrice: z.coerce
          .number({
            invalid_type_error: t('products.sales-price-type'),
          })
          .optional()
          .default(0),
        isBarred: z
          .preprocess(
            val => (val == '' ? 'false' : val),
            z.string({
              invalid_type_error:
                'Ukendt værdi i spærret. Brug true, false, ja eller nej',
            }),
          )
          .transform(val => val.trim().toLowerCase())
          .refine(
            value =>
              value === 'true' ||
              value === 'false' ||
              value === 'ja' ||
              value === 'nej',
            {
              message: 'Ukendt værdi i spærret. Brug true, false, ja eller nej',
            },
          )
          .transform(value => value === 'true' || value === 'ja'),
      })
      .strict({ message: 'Ukendt kolonne' })
      .superRefine((val, ctx) => {}),
  )

export type ImportProducts = z.infer<typeof importProductsValidation>

export const importProductsValidation = z.array(
  z.object({
    sku: z.string(),
    barcode: z.string(),
    group: z.string(),
    unit: z.enum(units),
    text1: z.string(),
    text2: z.string(),
    text3: z.string(),
    costPrice: z.coerce.number(),
    salesPrice: z.coerce.number(),
    isBarred: z.coerce.boolean(),
  }),
)

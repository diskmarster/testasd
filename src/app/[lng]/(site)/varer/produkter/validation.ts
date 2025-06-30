import { convertENotationToNumber, isNullOrUndefined } from '@/lib/utils'
import { z } from 'zod'

export const createProductValidation = (
  t: (key: string, options?: any) => string,
) =>
  z
    .object({
      customerID: z.coerce.number(),
      groupID: z.coerce.number(),
      unitID: z.coerce.number(),
      text1: z.string().min(1, t('products.product-text-required')).max(255, t('products.product1-max-length', {num: 255})),
      text2: z.string().max(255, t('products.product2-max-length', { num: 255})),
      text3: z.string().max(1000, t('products.product3-max-length', { num: 1000})),
      sku: z.string().min(1, t('products.sku-required')).max(25, t('products.sku-max-length', {num: 25})),
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
      supplierID: z.coerce.number().nullable(),
      text1: z.string().min(1, t('products.product-text-required')).max(255, t('products.product1-max-length', {num: 255})),
      text2: z.string().max(255, t('products.product2-max-length', { num: 255})),
      text3: z.string().max(1000, t('products.product3-max-length', { num: 1000})),
      note: z.string().max(1000, t('products.product3-max-length', { num: 1000})),
      sku: z.string().min(1, t('products.sku-required')).max(25, t('products.sku-max-length', { num: 25})),
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
  allUnits: string[],
) =>
  z.array(
    z
      .object({
        sku: z.preprocess(
          val => (!isNullOrUndefined(val) ? String(val) : '').toUpperCase(),
          z.coerce
            .string({ required_error: t('products.sku-required') })
            .min(1, { message: t('products.sku-preprocess') })
            .max(25, { message: t('products.sku-max-length', { num: 25})}),
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
			z.string()
          .refine(value => allUnits.includes(value.toLowerCase()), {
            message: `${t('products.unit-preprocess-unknown-type')} ${allUnits.join(', ')}`,
            },
          ),
        ),
        text1: z.preprocess(
          val => !isNullOrUndefined(val) ? String(val) : '',
          z
            .string({ required_error: t('products.product-text-required') })
            .min(1, { message: t('products.product-text-preprocess') })
            .max(255, { message: t('products.product1-max-length', {num: 255})}),
        ),
        text2: z.preprocess(
          val => !isNullOrUndefined(val) ? String(val) : undefined,
          z.string()
            .max(255, { message: t('products.product2-max-length', {num: 255})})
            .optional().default(''),
        ),
        text3: z.preprocess(
          val => !isNullOrUndefined(val) ? String(val) : undefined,
          z.string()
            .max(1000, { message: t('products.product3-max-length', {num: 1000})})
            .optional().default(''),
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
        note: z.preprocess(
          val => !isNullOrUndefined(val) ? String(val) : undefined,
          z.string()
            .max(1000, { message: t('products.product1-max-length', {num: 1000})})
            .optional().default(''),
        ),
        isBarred: z
          .preprocess(
            val => (val == '' ? 'false' : val),
            z.string({
              invalid_type_error: t('products.barred-values'),
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
              message: t('products.barred-values'),
            },
          )
          .transform(value => value === 'true' || value === 'ja'),
        minimum: z
          .preprocess(
            val => val != '' ? val : undefined,
            z.coerce
              .number({
                invalid_type_error: t('products.minimum-type'),
              })
			  .positive({
				  message: t('products.minimum-positive')
			  })
              .optional(),
          ),
        maximum: z
          .preprocess(
            val => val != '' ? val : undefined,
            z.coerce
              .number({
                invalid_type_error: t('products.maximum-type'),
              })
			  .positive({
				  message: t('products.maximum-positive')
			  })
              .optional()
              .default(0),
          ),
        orderAmount: z
          .preprocess(
            val => val != '' ? val : undefined,
            z.coerce
              .number({
                invalid_type_error: t('products.order-amount-type'),
              })
			  .positive({
				  message: t('products.order-amount-positive')
			  })
              .optional(),
          ),
      })
      .strict({ message: t('products.unknown-column') })
      .superRefine((val, ctx) => {
        if (val.minimum != undefined) {
          if (val.orderAmount == undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('products.order-amount-missing'),
              path: ['orderAmount'],
            })
          } else if (val.maximum > 0 && val.orderAmount > val.maximum) {
            ctx.addIssue({
              code: z.ZodIssueCode.too_big,
              maximum: val.maximum,
              type: 'number',
              inclusive: true,
              message: t('products.order-amount-bigger-than-max', {amount: val.orderAmount, max: val.maximum}),
              path: ['orderAmount'],
            })
          }
        }
      }),
  )

export type ImportProducts = z.infer<typeof importProductsValidation>

export const importProductsValidation = z.array(
  z.object({
    sku: z.string(),
    barcode: z.string(),
    group: z.string(),
    unit: z.string(), // units have already been validated here
    text1: z.string(),
    text2: z.string(),
    text3: z.string(),
    costPrice: z.coerce.number(),
    salesPrice: z.coerce.number(),
    note: z.string(),
    isBarred: z.coerce.boolean(),
    minimum: z.coerce.number().positive().optional(),
    maximum: z.coerce.number().positive(),
    orderAmount: z.coerce.number().positive().optional(),
  }),
)

export const deleteProductValidation = z.object({
  productID: z.coerce.number(),
})

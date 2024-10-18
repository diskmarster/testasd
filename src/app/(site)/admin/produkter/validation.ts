import { product } from '@/data/products'
import { units } from '@/data/products.types'
import { convertENotationToNumber } from '@/lib/utils'
import { z } from 'zod'

export const createProductValidation = z
  .object({
    customerID: z.coerce.number(),
    groupID: z.coerce.number(),
    unitID: z.coerce.number(),
    text1: z.string().min(1, 'Varetekst 1 skal udfyldes.'),
    text2: z.string(),
    text3: z.string(),
    sku: z.string().min(1, 'Varenr. skal udfyldes.'),
    barcode: z.string().min(1, 'Stregkode skal udfyldes.'),
    costPrice: z.coerce.number(),
    salesPrice: z.coerce.number(),
  })
  .superRefine((val, ctx) => {
    if (val.costPrice < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['costPrice'],
        message: 'Kostpris kan ikke være negativ',
      })
    }

    if (val.costPrice == undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['costPrice'],
        message: 'Kostpris skal udfyldes',
      })
    }
  })
export const updateProductValidation = z.object({
  productID: z.coerce.number(),
  data: z.object({
    customerID: z.coerce.number(),
    groupID: z.coerce.number(),
    unitID: z.coerce.number(),
    text1: z.string().min(1, 'Varetekst 1 skal udfyldes.'),
    text2: z.string(),
    text3: z.string(),
    sku: z.string().min(1, 'Varenr. skal udfyldes.'),
    barcode: z.string().min(1, 'Stregkode skal udfyldes.'),
    costPrice: z.coerce.number(),
    salesPrice: z.coerce.number(),
  }),
})

export const productToggleBarredValidation = z.object({
  productID: z.coerce.number(),
  isBarred: z.coerce.boolean(),
})

export const productsDataValidation = z.array(
  z
    .object({
      sku: z.preprocess(
        // @ts-ignore
        val => val.toString().toUpperCase(),
        z.coerce
          .string({ required_error: 'Varenr. skal være udfyldt' })
          .min(1, { message: 'Varenr. skal være minimum 1 karakter lang' }),
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
          .string({ required_error: 'Stregkode skal være udfyldt' })
          .min(1, { message: 'Stregkode skal være minimum 1 karakter lang' }),
      ),
      group: z.coerce
        .string({ required_error: 'Varegruppe skal være udfyldt' })
        .min(1, { message: 'Varegruppe skal være minimum 1 karakter lang' }),
      unit: z.preprocess(
        //@ts-ignore - string is not the same as the value in units bla bla shut up typescript
        (val: string) => val.trim().toLowerCase(),
        z.enum(units, {
          invalid_type_error: `Ukendt enhed. Brug f.eks. ${units.join(', ')}`,
          message: `Ukendt enhed. Brug f.eks. ${units.join(', ')}`,
        }),
      ),
      text1: z.preprocess(
        // @ts-ignore
        val => val.toString(),
        z
          .string({ required_error: 'Varetekst 1 skal være udfyldt' })
          .min(1, { message: 'Varetekst 1 skal være minimum 1 karakter lang' }),
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
          invalid_type_error: 'Kostpris kan ikke være andet end et nummer',
        })
        .default(0),
      salesPrice: z.coerce
        .number({
          invalid_type_error: 'Salgspris kan ikke være andet end et nummer',
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
    .superRefine((val, ctx) => { }),
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

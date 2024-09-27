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

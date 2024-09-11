import { z } from 'zod'

export const createProductValidation = z
  .object({
    customerID: z.coerce.number(),
    groupID: z.coerce.number(),
    unitID: z.coerce.number(),
    text1: z.string().min(1, 'Skal være udfyldt.'),
    text2: z.string(),
    text3: z.string(),
    sku: z.string().min(1, 'Skal være udfyldt.'),
    barcode: z.string().min(1, 'Skal være udfyldt.'),
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

import { z } from 'zod'

export const sendEmailValidation = z.object({
	orderID: z.string(),
  email: z.string().email(),
  lines: z.array(
    z.object({
      supplier: z.string(),
      sku: z.string(),
      barcode: z.string(),
      text1: z.string(),
      text2: z.string(),
      unitName: z.string(),
      costPrice: z.coerce.number(),
      quantity: z.coerce.number(),
      sum: z.coerce.number(),
    }),
  ),
})

import { z } from 'zod'

export const createProductValidation = z.object({
  customerID: z.number(),
  groupID: z.number(),
  unitID: z.number().min(1, 'Skal være udfyldt.'),
  text1: z.string().min(1, 'Skal være udfyldt.'),
  text2: z.string(),
  text3: z.string(),
  sku: z.string().min(1, 'Skal være udfyldt.'),
  barcode: z.string().min(1, 'Skal være udfyldt.'),
  costPrice: z.coerce.number(),
  salesPrice: z.coerce.number(),
})

import { historyTypeZodSchema } from '@/data/inventory.types'
import { z } from 'zod'

export const updateInventoryValidation = z
  .object({
    productID: z.coerce.number(),
    placementID: z.coerce.number().or(z.string()),
    batchID: z.coerce.number().or(z.string()),
    type: historyTypeZodSchema,
    amount: z.coerce.number(),
  })
  .superRefine((val, ctx) => {
    if (val.type == 'afgang' || val.type == 'regulering') {
      if (typeof val.placementID == 'string') {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_type,
          message: 'Ugyldig placering',
          expected: 'number',
          received: 'string',
        })
      }
      if (typeof val.batchID == 'string') {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_type,
          message: 'Ugyldig batchnr.',
          expected: 'number',
          received: 'string',
        })
      }
    }
  })

export const moveInventoryValidation = z.object({
  productID: z.coerce.number(),
  fromPlacementID: z.coerce.number(),
  fromBatchID: z.coerce.number(),
  toPlacementID: z.coerce.number(),
  amount: z.coerce.number().min(1),
})

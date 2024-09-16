import { historyTypeZodSchema } from '@/data/inventory.types'
import { z } from 'zod'

export const updateInventoryValidation = z
  .object({
    productID: z.coerce.number(),
    placementID: z.string().or(z.coerce.number()),
    batchID: z.string().or(z.coerce.number()),
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
    } else {
      if (val.placementID == '') {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_type,
          message: 'Placering kan ikke være tom',
          expected: 'number',
          received: 'string',
        })
      }
      if (val.batchID == '') {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_type,
          message: 'Batch kan ikke være tom',
          expected: 'number',
          received: 'string',
        })
      }
    }
  })

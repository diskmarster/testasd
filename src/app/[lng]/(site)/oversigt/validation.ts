import { historyTypeZodSchema } from '@/data/inventory.types'
import { z } from 'zod'

export const updateInventoryValidation = (
  t: (key: string, options?: any) => string,
) =>
  z
    .object({
      productID: z.coerce.number(),
      placementID: z.string().or(z.coerce.number()),
      batchID: z.string().or(z.coerce.number()),
      type: historyTypeZodSchema,
      amount: z.coerce.number(),
      reference: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.type == 'afgang' || val.type == 'regulering') {
        if (typeof val.placementID == 'string') {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            message: t('updateInventory.invalid-placement'),
            expected: 'number',
            received: 'string',
          })
        }
        if (typeof val.batchID == 'string') {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            message: t('updateInventory.invalid-batch'),
            expected: 'number',
            received: 'string',
          })
        }
      } else {
        if (val.placementID == '') {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            message: t('updateInventory.empty-placement'),
            expected: 'number',
            received: 'string',
          })
        }
        if (val.batchID == '') {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            message: t('updateInventory.empty-batch'),
            expected: 'number',
            received: 'string',
          })
        }
      }
    })

export const moveInventoryValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    productID: z.coerce.number(),
    fromPlacementID: z.coerce.number(),
    fromBatchID: z.coerce.number(),
    toPlacementID: z.coerce.number(),
    amount: z.coerce
      .number({ message: t('updateInventory.move-quantity-type') })
      .min(1, { message: t('updateInventory.move-quantity-number') }),
    reference: z.string().optional(),
  })

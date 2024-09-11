import { historyTypeZodSchema } from '@/data/inventory.types'
import { z } from 'zod'

export const updateInventoryValidation = z.object({
  productID: z.coerce.number(),
  placementID: z.coerce.number(),
  batchID: z.coerce.number(),
  type: historyTypeZodSchema,
  amount: z.coerce.number(),
})

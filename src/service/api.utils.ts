import { historyTypeZodSchema } from '@/data/inventory.types'
import { z } from 'zod'

export const createRegulationSchema = z.object({
  locationId: z.string(),
  productId: z.coerce.number(),
  placementId: z.string().or(z.coerce.number()).nullable(),
  batchId: z.string().or(z.coerce.number()).nullable(),
  type: historyTypeZodSchema.exclude(['slet']),
  quantity: z.coerce.number(),
  reference: z.string().nullable(),
})
export type CreateRegulation = z.infer<typeof createRegulationSchema>

import { z } from 'zod'

export const createPlacementValidation = z.object({
  name: z.string().min(1, 'Placering navn er påkrævet'),
})

export const updatePlacementValidation = z.object({
  placementID: z.coerce.number(),
  data: z.object({
    name: z.string().min(1, 'Placering navn er påkrævet'),
  }),
})

export const toggleBarredPlacementValidation = z.object({
  placementID: z.coerce.number(),
  isBarred: z.coerce.boolean(),
})

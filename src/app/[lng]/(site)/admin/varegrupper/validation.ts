import { z } from 'zod'

export const createGroupValidation = z.object({
  name: z.string().min(1, 'Varegruppenavn er påkrævet'),
})

export const updateGroupValidation = z.object({
  groupID: z.coerce.number(),
  data: z.object({
    name: z.string().min(1, 'Varegruppenavn er påkrævet'),
  }),
})

export const groupToggleBarredValidation = z.object({
  groupID: z.coerce.number(),
  isBarred: z.coerce.boolean(),
})

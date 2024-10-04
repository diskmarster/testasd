import { userRoleZodSchema } from '@/data/user.types'
import { z } from 'zod'

export const inviteNewUserValidation = z.object({
  email: z.string().email({ message: 'Email skal være gyldig' }),
  role: userRoleZodSchema,
  locationIDs: z
    .array(z.string())
    .min(1, { message: 'Minimum en lokation skal vælges' }),
})

export const toggleUserStatusValidation = z.object({
  userID: z.coerce.number(),
  status: z.coerce.boolean()
})

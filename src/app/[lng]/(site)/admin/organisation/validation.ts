import { userRoleZodSchema } from '@/data/user.types'
import { z } from 'zod'

export const inviteNewUserValidation = z.object({
  email: z.string().email({ message: 'Email skal være gyldig' }),
  role: userRoleZodSchema,
  locationIDs: z
    .array(z.string())
    .min(1, { message: 'Minimum en lokation skal vælges' }),
  webAccess: z.coerce.boolean(),
  appAccess: z.coerce.boolean(),
  priceAccess: z.coerce.boolean(),
})

export const changeUserStatusValidation = z.object({
  userIDs: z
    .array(z.coerce.number())
    .min(1, { message: 'Kunne ikke hente brugernes information. Prøv at luk og åben pop-up vinduet' }),
  status: z.enum(['active', 'inactive'])
})

export const createNewLocationValidation = z.object({
  name: z
    .string()
    .min(3, { message: 'Lokationsnavn skal være minimum 3 karaktere lang' }),
  customerID: z.coerce.number(),
  userIDs: z
    .array(z.coerce.number())
    .min(1, { message: 'Minimum en lokation skal vælges' }),
  pathname: z.string().min(1),
})

export const editLocationValidation = z.object({
  locationID: z.string().min(1, { message: 'Kunne ikke hente lokationens information. Prøv at luk og åben pop-up vinduet' }),
  name: z
    .string()
    .min(3, { message: 'Lokationsnavn skal være minimum 3 karaktere lang' }),
  customerID: z.coerce.number(),
  userIDs: z
    .array(z.coerce.number())
    .min(1, { message: 'Minimum en bruger skal vælges' }),
})

export const changeLocationStatusValidation = z.object({
  locationIDs: z
    .array(z.string())
    .min(1, { message: 'Minimum en lokation skal vælges' }),
  status: z.enum(['active', 'inactive'])
})

export const updateCustomerValidation = z.object({
  company: z.string().min(2, { message: 'Firmanavn skal være minimum 2 karakterer' }),
  email: z.string().email({ message: 'Email skal være gyldig' }),
})

export const resetUserPasswordValidation = z.object({
  userID: z.coerce.number(),
  email: z.string().email()
})

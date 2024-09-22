import { z } from 'zod'

export const createReorderValidation = z.object({
  productID: z.coerce.number({ required_error: 'Et produkt skal vælges' }),
  locationID: z.string().min(1),
  buffer: z.coerce
    .number()
    .positive({ message: 'Buffer rate skal være positiv' }),
  minimum: z.coerce
    .number()
    .min(1, { message: 'Minimums beholdning skal være større end 1' }),
})

export const updateReorderValidation = z.object({
  productID: z.coerce.number({ required_error: 'Et produkt skal vælges' }),
  locationID: z.string().min(1),
  buffer: z.coerce
    .number()
    .positive({ message: 'Buffer rate skal være positiv' }),
  minimum: z.coerce
    .number()
    .min(1, { message: 'Minimums beholdning skal være større end 1' }),
})

export const deleteReorderValidation = z.object({
  productID: z.coerce.number({ required_error: 'Et produkt skal vælges' }),
  locationID: z.string().min(1),
})

import { z } from 'zod'

export const createReorderValidation = z.object({
  productID: z.coerce.number({ required_error: 'Et produkt skal vælges' }),
  locationID: z.string().min(1),
  minimum: z.coerce
    .number()
    .min(1, { message: 'Minimums beholdning skal være større end 1' }),
})

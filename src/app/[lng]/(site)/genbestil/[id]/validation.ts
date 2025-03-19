import { z } from 'zod'

export const sendEmailValidation = z.object({
  orderID: z.string(),
  //email: z.string().email(),
  emails: z.array(z.string().email()),
})

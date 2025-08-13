import { z } from 'zod'

export const sendEmailValidation = z.object({
	orderID: z.string(),
	emails: z.array(z.string().email()),
})

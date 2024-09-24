import { z } from 'zod'

export const signUpValidation = z.object({
  linkID: z.string(),
  clientID: z.coerce.number(),
  name: z.string().min(2, { message: 'Navn skal minimum være 2 karakterer' }),
  email: z.string().email({ message: 'Email skal være gyldig' }),
  password: z
    .string()
    .min(8, { message: 'Kodeord skal minimum være 8 karakterer' }),
  confirmPassword: z
    .string()
    .min(8, { message: 'Kodeord skal minimum være 8 karakterer' }),
  pin: z.string().length(4, { message: 'PIN-koden skal være på 4 tal.' }),
})

import { z } from 'zod'

export const signUpInvitedValidation = z
  .object({
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
    pin: z.string().length(4, 'PIN-koden skal være på 4 cifre.'),
  })
  .superRefine((val, ctx) => {
    if (!/^\d{4}$/.test(val.pin)) {
      ctx.addIssue({
        path: ['pin'],
        code: z.ZodIssueCode.custom,
        message: 'PIN-koden skal bestå af tal.',
      })
    }
  })

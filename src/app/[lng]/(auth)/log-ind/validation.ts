import { z } from 'zod'

export const signInValidation = (t: (key: string, options?: any) => string) =>
  z.object({
    email: z.string().email({ message: t('log-in.email') }),
    password: z.string(),
		redirectPath: z.string().nullable(),
  })

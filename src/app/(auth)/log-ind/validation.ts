import { z } from "zod";

export const signInValidation = z.object({
  email: z.string().email({ message: 'Email skal være gyldig' }),
  password: z.string().min(8, { message: 'Kodeord skal minimum være 8 karakterer lang' }),
})

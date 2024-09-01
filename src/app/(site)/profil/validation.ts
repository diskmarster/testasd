import { userRoleZodSchema } from '@/data/user.types'
import { z } from 'zod'

export const updateProfileValidation = z.object({
  name: z.string().min(2, { message: 'Navn skal være minimum 2 karakterer' }),
  email: z.string().email({ message: 'Email skal være gyldig' }),
})

export const adminUpdateProfileValidation = z.object({
  userId: z.string(),
  name: z.string().min(2, { message: 'Navn skal minimum være 2 karakterer' }),
  email: z.string().email({ message: 'Email skal være gyldig' }),
  role: userRoleZodSchema,
})

export const deleteProfileValidation = z.object({
  userId: z.coerce.number(),
})

export const updatePasswordValidation = z
  .object({
    currentPassword: z.string(),
    newPassword: z
      .string()
      .regex(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{8,}$/,
        {
          message:
            'Kodeord skal minimum være 8 karakterer, have et stork bogstav, nummer og special karakter',
        },
      ),
    confirmPassword: z.string(),
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Kodeordene er ikke ens',
        path: ['confirmPassword'],
      })
    }
  })

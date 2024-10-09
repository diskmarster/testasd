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
            'Kodeord skal minimum være 8 karakterer, have et stort bogstav, nummer og special karakter',
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
  .superRefine(({ newPassword, currentPassword }, ctx) => {
    if (newPassword == currentPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Dit nuværende Password og dit nye Password er det samme',
        path: ['confirmPassword'],
      })
    }
  })

export const updatePinValidation = z
  .object({
    currentPin: z.string(),
    newPin: z.string().regex(/^\d{4}$/, {
      message: 'PIN-koden skal have en længde på 4, og skal være tal',
    }),
    confirmPin: z.string(),
  })
  .superRefine(({ newPin, confirmPin }, ctx) => {
    if (newPin !== confirmPin) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ny PIN og Bekræft PIN er ikke ens.',
        path: ['confirmPin'],
      })
    }
  })
  .superRefine(({ newPin, currentPin }, ctx) => {
    if (newPin == currentPin) {
      ctx.addIssue({
        code: 'custom',
        message: 'Din nuværende PIN-kode og din nye PIN-kode er den samme',
        path: ['confirmPin'],
      })
    }
  })

export const updatePrimaryLocationValidation = z.object({
  locationID: z.string(),
})

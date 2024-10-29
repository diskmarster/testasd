import { z } from 'zod'

export const createPlacementValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    name: z
      .string({ message: t('placement.name-required') })
      .min(1, t('placement.name-minLength', { minLength: 1 }))
      .max(50, t('placement.name-maxLength', { maxLength: 50 })),
  })

export const updatePlacementValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    placementID: z.coerce.number(),
    data: z.object({
      name: z
        .string({ message: t('placement.name-required') })
        .min(1, t('placement.name-minLength', { minLength: 1 }))
        .max(50, t('placement.name-maxLength', { maxLength: 50 })),
    }),
  })

export const toggleBarredPlacementValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    placementID: z.coerce.number(),
    isBarred: z.coerce.boolean(),
  })

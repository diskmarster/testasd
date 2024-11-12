import { z } from 'zod'

export const createBatchValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    batchName: z.string().min(1, 'Batch navn er påkrævet'),
    expiry: z.coerce.date({ message: 'Udløbsdatoen er ugyldig' }),
  })

export const updateBatchValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    batchID: z.coerce.number(),
    data: z.object({
      batch: z.string().min(1, 'Batch navn er påkrævet'),
      expiry: z.coerce.date({ message: 'Udløbsdatoen er ugyldig' }).nullable(),
    }),
  })

export const toggleBarredBatchValidation = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    batchID: z.coerce.number(),
    isBarred: z.coerce.boolean(),
  })

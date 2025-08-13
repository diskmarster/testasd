import { z } from 'zod'

export const createUnitValidation = z.object({
	name: z.string().min(1, 'Enhed er påkrævet'),
})
export const updateUnitValidation = z.object({
	unitID: z.coerce.number(),
	data: z.object({
		name: z.string().min(1, 'Enhed er påkrævet'),
	}),
})
export const toggleBarredUnitValidation = z.object({
	unitID: z.coerce.number(),
	isBarred: z.coerce.boolean(),
})

import { z } from 'zod'

export const moveBetweenLocationsSchema = z.object({
	fromLocation: z.string(),
	reference: z.string().optional(),
	fields: z
		.array(
			z.object({
				toLocationID: z.string(),
				productID: z.coerce.number(),
				sku: z.string(),
				fromPlacementID: z.coerce.number().optional(),
				fromBatchID: z.coerce.number().optional(),
				quantity: z.coerce.number(),
			}),
		)
		.min(1),
})

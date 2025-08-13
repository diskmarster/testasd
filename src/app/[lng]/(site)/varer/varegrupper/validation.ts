import { z } from 'zod'

export const createGroupValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		name: z.string().min(1, t('product-groups.name-required')),
	})

export const updateGroupValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		groupID: z.coerce.number(),
		data: z.object({
			name: z.string().min(1, t('product-groups.name-required')),
		}),
	})

export const groupToggleBarredValidation = z.object({
	groupID: z.coerce.number(),
	isBarred: z.coerce.boolean(),
})

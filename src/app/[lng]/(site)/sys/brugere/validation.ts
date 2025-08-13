import { userRoleZodSchema } from '@/data/user.types'
import { z } from 'zod'

export const deleteUserByIDValidation = z.object({ userID: z.coerce.number() })

export const deleteInviteLinkValidation = z.object({
	linkID: z.string(),
})

export const refreshInviteLinkValidation = z.object({
	linkID: z.string(),
})

export const inviteOrCreateUserValidation = z
	.object({
		customerID: z.coerce.number(),
		locationsID: z.array(z.string()),
		email: z.string(),
		role: userRoleZodSchema,
		appAccess: z.coerce.boolean(),
		webAccess: z.coerce.boolean(),
		priceAccess: z.coerce.boolean(),
		isInvite: z.coerce.boolean().default(false),
		name: z.string().optional(),
		password: z.string().optional(),
		pin: z.string().optional(),
		mail: z.coerce.boolean().default(false),
	})
	.superRefine((v, ctx) => {
		if (v.isInvite) {
			if (v.name != undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Navn må ikke være udfyldt når du opretter en invitering',
					path: ['name'],
				})
			}
			if (v.password != undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						'Adgangskode må ikke være udfyldt når du opretter en invitering',
					path: ['password'],
				})
			}
			if (v.pin != undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						'PIN kode må ikke være udfyldt når du opretter en invitering',
					path: ['pin'],
				})
			}
		} else {
			if (v.name == undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Navn skal være udfyldt når du opretter en bruger',
					path: ['name'],
				})
			}
			if (v.password == undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Adgangskode skal være udfyldt når du opretter en bruger',
					path: ['password'],
				})
			}
			if (v.pin == undefined) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'PIN kode skal være udfyldt når du opretter en bruger',
					path: ['pin'],
				})
			}
		}
	})

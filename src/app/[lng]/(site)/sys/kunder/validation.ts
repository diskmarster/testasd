import { planZodSchema } from '@/data/customer.types'
import { convertENotationToNumber, excelDateToJSDate } from '@/lib/utils'
import { z } from 'zod'

export const createClientValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		company: z
			.string({
				message: t('create-validation.company-required'),
			})
			.min(3, {
				message: t('create-validation.company-min', { minLength: 3 }),
			})
			.max(50, {
				message: t('create-validation.company-max', { maxLength: 50 }),
			}),
		email: z
			.string({
				message: t('create-validation.email-required'),
			})
			.email({
				message: t('create-validation.email.invalid'),
			}),
		plan: planZodSchema,
		extraUsers: z.coerce.number().min(0).default(0),
	})

export const toggleClientStatusValidation = z.object({
	customerID: z.coerce.number(),
	isActive: z.coerce.boolean(),
})

export const deleteClientStatusValidation = z.object({
	customerID: z.coerce.number(),
})

export const updateClientValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		customerID: z.coerce.number(),
		company: z
			.string({
				message: t('create-validation.company-required'),
			})
			.min(3, {
				message: t('create-validation.company-min', { minLength: 3 }),
			})
			.max(50, {
				message: t('create-validation.company-max', { maxLength: 50 }),
			}),
		email: z
			.string({
				message: t('create-validation.email-required'),
			})
			.email({
				message: t('create-validation.email.invalid'),
			}),
		plan: planZodSchema,
		extraUsers: z.coerce.number().min(0).default(0),
	})

export const importInventoryDataValidation = (
	t: (key: string, opt?: any) => string,
) =>
	z.array(
		z
			.object({
				sku: z.preprocess(
					val => String(val).toUpperCase(),
					z.coerce
						.string({
							required_error: t('import-validation.sku-required'),
						})
						.min(1, { message: t('import-validation.sku-min-length') })
						.max(25, {
							message: t('import-validation.sku-max-length', { num: 25 }),
						}),
				),
				placement: z.preprocess(
					val => String(val).toUpperCase(),
					z.coerce
						.string()
						.max(25, {
							message: t('import-validation.sku-max-length', { num: 25 }),
						})
						.superRefine(v => {
							if (v == '') {
								v = '-'
							}
						}),
				),
				quantity: z.coerce.number({
					required_error: t('import-validation.quantity-required'),
				}),
			})
			.strict({ message: t('import-inventory.unknown-column') }),
	)

export const importInventoryValidation = z.object({
	customerID: z.coerce.number(),
	locationID: z.string(),
	items: z.array(
		z.object({
			sku: z.string(),
			placement: z.string(),
			quantity: z.coerce.number(),
		}),
	),
})

export const importHistoryDataValidation = (
	t: (key: string, opt?: any) => string,
	allUnits: string[],
) =>
	z.array(
		z
			.object({
				inserted: z.coerce.number().transform(val => excelDateToJSDate(val)),
				sku: z.preprocess(val => String(val).toUpperCase(), z.coerce.string()),
				barcode: z.preprocess(val => {
					if (typeof val == 'string') {
						return convertENotationToNumber(val).toUpperCase()
					} else {
						return val
					}
				}, z.coerce.string()),
				group: z.coerce.string(),
				text1: z.string(),
				text2: z.string(),
				text3: z.string(),
				costPrice: z.coerce.number().default(0),
				salesPrice: z.coerce.number().default(0),
				unit: z.preprocess(
					val => (val as string).trim().toLowerCase(),
					z
						.string()
						.refine(value => allUnits.includes(value.toLowerCase()), {
							message: `${t('products.unit-preprocess-unknown-type')} ${allUnits.join(', ')}`,
						})
						.transform(
							val => val.substring(0, 1).toUpperCase() + val.substring(1),
						),
				),
				type: z.enum(['tilgang', 'afgang', 'regulering']),
				quantity: z.coerce.number(),
				placement: z.preprocess(
					val => String(val).toUpperCase(),
					z.coerce.string().superRefine(v => {
						if (v == '') {
							v = '-'
						}
					}),
				),
				batch: z.preprocess(
					val => String(val).toUpperCase(),
					z.coerce.string().superRefine(v => {
						if (v == '') {
							v = '-'
						}
					}),
				),
				user: z.coerce.string(),
				reference: z.coerce.string().default(''),
				platform: z.enum(['web', 'app']),
			})
			.strict({ message: t('import-inventory.unknown-column') }),
	)

export const importHistoryValidation = z.object({
	customerID: z.coerce.number(),
	locationID: z.string(),
	items: z.array(
		z.object({
			inserted: z.coerce.date(),
			sku: z.string(),
			barcode: z.string(),
			group: z.string(),
			text1: z.string(),
			text2: z.string(),
			text3: z.string(),
			costPrice: z.coerce.number(),
			salesPrice: z.coerce.number(),
			unit: z.string(),
			type: z.string(),
			quantity: z.coerce.number(),
			placement: z.string(),
			batch: z.string(),
			user: z.coerce.string(),
			reference: z.string(),
			platform: z.string(),
		}),
	),
})

export const createApiKeyValidation = z.object({
	customerID: z.coerce.number(),
	name: z.string().min(3),
	expiry: z.coerce.date().optional(),
})

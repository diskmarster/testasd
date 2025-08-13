import { TFunction } from 'i18next'
import { z } from 'zod'

export const createReorderValidation = (t: TFunction<'genbestil'>) =>
	z
		.object({
			productID: z.coerce.number({
				message: t('modal-create-reorder.required'),
			}),
			minimum: z.coerce
				.number({
					message: t('modal-create-reorder.value-not-number'),
				})
				.refine(val => !isNaN(val) && val > 0, {
					message: t('modal-create-reorder.value-not-positive'),
				}),
			orderAmount: z.coerce
				.number({
					message: t('modal-create-reorder.value-not-number'),
				})
				.refine(val => !isNaN(val) && val > 0, {
					message: t('modal-create-reorder.value-not-positive'),
				}),
			maxOrderAmount: z.coerce
				.number({
					message: t('modal-create-reorder.value-not-number'),
				})
				.refine(val => !isNaN(val) && val >= 0, {
					message: t('modal-create-reorder.value-not-positive'),
				})
				.default(0),
		})
		.superRefine((val, ctx) => {
			if (val.maxOrderAmount > 0 && val.orderAmount > val.maxOrderAmount) {
				ctx.addIssue({
					code: 'custom',
					path: ['orderAmount'],
					message: t('modal-create-reorder.orderAmount-too-big'),
				})
				ctx.addIssue({
					code: 'custom',
					path: ['maxOrderAmount'],
					message: t('modal-create-reorder.orderAmount-too-big'),
				})
			}
		})

export const updateReorderValidation = (t: TFunction<'genbestil'>) =>
	z
		.object({
			productID: z.coerce.number({
				message: t('modal-create-reorder.required'),
			}),
			minimum: z.coerce
				.number({
					message: t('modal-create-reorder.value-not-number'),
				})
				.refine(val => !isNaN(val) && val > 0, {
					message: t('modal-create-reorder.value-not-positive'),
				}),
			orderAmount: z.coerce
				.number({
					message: t('modal-create-reorder.value-not-number'),
				})
				.refine(val => !isNaN(val) && val > 0, {
					message: t('modal-create-reorder.value-not-positive'),
				}),
			maxOrderAmount: z.coerce
				.number({
					message: t('modal-create-reorder.value-not-number'),
				})
				.refine(val => !isNaN(val) && val >= 0, {
					message: t('modal-create-reorder.value-not-positive'),
				})
				.default(0),
		})
		.superRefine((val, ctx) => {
			if (val.maxOrderAmount > 0 && val.orderAmount > val.maxOrderAmount) {
				ctx.addIssue({
					code: 'custom',
					path: ['orderAmount'],
					message: t('modal-create-reorder.orderAmount-too-big'),
				})
				ctx.addIssue({
					code: 'custom',
					path: ['maxOrderAmount'],
					message: t('modal-create-reorder.orderAmount-too-big'),
				})
			}
		})

export const deleteReorderValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		productID: z.coerce.number({ message: t('restock.product-required') }),
		locationID: z.string().min(1),
	})

export const addOrderedToReorderValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		productID: z.coerce.number({ message: t('restock.product.required') }),
		locationID: z.string().min(1),
		ordered: z.coerce
			.number()
			.positive({ message: t('restock.ordered-quantity-positive') }),
	})

export const bulkAddOrderedToReorderValidation = (
	t: (key: string, options?: any) => string,
) =>
	z.object({
		items: z
			.array(
				z
					.object({
						text1: z.string(),
						sku: z.string(),
						productID: z.coerce.number(),
						ordered: z.coerce
							.number()
							.positive({ message: t('bulk.errors.positive') }),
						alreadyOrdered: z.coerce.number(),
						supplierName: z.string().nullable(),
						supplierID: z.coerce.number().nullable(),
						quantity: z.coerce.number(),
						disposable: z.coerce.number(),
						maxOrderAmount: z.coerce.number(),
						shouldReorder: z.boolean(),
						barcode: z.string(),
						text2: z.string(),
						unitName: z.string(),
						groupName: z.string(),
						costPrice: z.coerce.number(),
						minimum: z.coerce.number(),
						isRequested: z.coerce.boolean(),
					})
					.superRefine((val, ctx) => {
						if (0 < val.maxOrderAmount && val.maxOrderAmount < val.ordered) {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								path: ['ordered'],
								message: t('bulk.errors.ordered-too-big', {
									count: val.maxOrderAmount,
								}),
							})
						}
					}),
			)
			.min(1),
	})

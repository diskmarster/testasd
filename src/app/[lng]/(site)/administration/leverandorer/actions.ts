'use server'

import { adminAction } from '@/lib/safe-action'
import { suppliersService } from '@/service/suppliers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createSupplierValidation } from './validation'

export const createSupplierAction = adminAction
	.metadata({ actionName: 'createSupplier' })
	.schema(createSupplierValidation)
	.action(async ({ parsedInput, ctx }) => {
		await suppliersService.create({
			...parsedInput,
			userID: ctx.user.id,
			userName: ctx.user.name,
			customerID: ctx.user.customerID,
		})
		revalidatePath(`/${ctx.lang}/administration/leverandorer`)
	})

export const deleteSupplierAction = adminAction
	.metadata({ actionName: 'deleteSupplier' })
	.schema(z.object({ id: z.coerce.number() }))
	.action(async ({ parsedInput: { id }, ctx: { user, lang } }) => {
		await suppliersService.deleteByID(id, user.customerID)
		revalidatePath(`/${lang}/administration/leverandorer`)
	})

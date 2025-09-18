import { supplierCountriesSchema } from '@/data/suppliers.types'
import { z } from 'zod'

export const createSupplierValidation = z.object({
	name: z.string().min(1).max(100),
	country: supplierCountriesSchema,
	idOfClient: z.string().max(100).optional(),
	phone: z.string().max(100).optional(),
	email: z.string().max(100),
	contactPerson: z.string().max(100).optional(),
})

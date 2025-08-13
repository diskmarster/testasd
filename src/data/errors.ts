import { db, TRX } from '@/lib/database'
import { userTable } from '@/lib/database/schema/auth'
import { customerTable } from '@/lib/database/schema/customer'
import {
	ApplicationError,
	errorsTable,
	NewApplicationError,
} from '@/lib/database/schema/errors'
import { desc, eq, getTableColumns } from 'drizzle-orm'
import { FormattedError } from './errors.types'

export const errors = {
	create: async function (
		newError: NewApplicationError,
		trx: TRX = db,
	): Promise<ApplicationError | undefined> {
		const errorRes = await trx.insert(errorsTable).values(newError).returning()
		return errorRes[0]
	},
	getAll: async function (trx: TRX = db): Promise<FormattedError[]> {
		return await trx
			.select({
				...getTableColumns(errorsTable),
				company: customerTable.company,
				user: userTable.name,
			})
			.from(errorsTable)
			.innerJoin(customerTable, eq(customerTable.id, errorsTable.customerID))
			.innerJoin(userTable, eq(userTable.id, errorsTable.userID))
			.orderBy(desc(errorsTable.inserted))
	},
}

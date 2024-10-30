import { db, TRX } from '@/lib/database'
import {
  ApplicationError,
  errorsTable,
  NewApplicationError,
} from '@/lib/database/schema/errors'

export const errors = {
  create: async function (
    newError: NewApplicationError,
    trx: TRX = db,
  ): Promise<ApplicationError | undefined> {
    const errorRes = await trx.insert(errorsTable).values(newError).returning()
    return errorRes[0]
  },
  getAll: async function (trx: TRX = db): Promise<ApplicationError[]> {
    return await trx.select().from(errorsTable)
  },
}

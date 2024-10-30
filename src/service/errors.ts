import { errors } from '@/data/errors'
import {
  ApplicationError,
  NewApplicationError,
} from '@/lib/database/schema/errors'

export const errorsService = {
  create: async function (
    newError: NewApplicationError,
  ): Promise<ApplicationError | undefined> {
    return await errors.create(newError)
  },
  getAll: async function (): Promise<ApplicationError[]> {
    return await errors.getAll()
  },
}

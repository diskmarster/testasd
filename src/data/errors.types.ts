import { ApplicationError } from '@/lib/database/schema/errors'

export type ErrorsCategory = 'action' | 'endpoint'

export interface FormattedError extends ApplicationError {
  company: string
  user: string
}

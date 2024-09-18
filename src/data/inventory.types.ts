import { UserNoHash } from '@/lib/database/schema/auth'
import { CustomerID, LocationID } from '@/lib/database/schema/customer'
import {
  Batch,
  History,
  Placement,
  Product,
  Reorder,
} from '@/lib/database/schema/inventory'
import { z } from 'zod'

export const historyTypeZodSchema = z.enum([
  'tilgang',
  'afgang',
  'regulering',
  'flyt',
])
export type HistoryType = z.infer<typeof historyTypeZodSchema>
export const historyTypes =
  historyTypeZodSchema.options as readonly HistoryType[]

export const historyPlatformZodSchema = z.enum(['web', 'app'])
export type HistoryPlatform = z.infer<typeof historyPlatformZodSchema>
export const platformTypes =
  historyPlatformZodSchema.options as readonly HistoryPlatform[]

export type FormattedInventory = {
  inserted: Date
  updated: Date
  quantity: number
  customerID: CustomerID
  locationID: LocationID
  product: Product & { unit: string; group: string }
  placement: Placement
  batch: Batch
}

export interface FormattedHistory extends History {
  product: Product & { unit: string; group: string }
  placement: Placement
  batch: Batch
  user: UserNoHash
}

export interface FormattedReorder extends Reorder {
  product: Product & { unit: string; group: string }
}

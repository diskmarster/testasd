import { UserNoHash } from '@/lib/database/schema/auth'
import { CustomerID, LocationID } from '@/lib/database/schema/customer'
import {
  Batch,
  History,
  Placement,
  Product,
} from '@/lib/database/schema/inventory'
import { Reorder } from '@/lib/database/schema/reorders'
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
export type RegulationType = HistoryType
export const regulationTypes = historyTypes

export const historyPlatformZodSchema = z.enum(['web', 'app'])
export type HistoryPlatform = z.infer<typeof historyPlatformZodSchema>
export const platformTypes =
  historyPlatformZodSchema.options as readonly HistoryPlatform[]

export const productHistoryTypeZodSchema = z.enum([
  'oprettelse',
  'opdatering',
  'spærring',
])
export type ProductHistoryType = z.infer<typeof productHistoryTypeZodSchema>
export const productHistoryTypes =
  productHistoryTypeZodSchema.options as readonly ProductHistoryType[]

export type FormattedInventory = {
  inserted: Date
  updated: Date
  quantity: number
  customerID: CustomerID
  locationID: LocationID
  product: Product & {
	  unit: string 
	  group: string
	  fileCount: number 
	  supplierName: string | null
  }
  placement: Placement
  batch: Batch
}

export interface FormattedHistory extends History {
  product: Product & { unit: string; group: string }
  placement: Placement
  batch: Batch
  user: UserNoHash
}

export interface HistoryWithSums extends History {
  costTotal: number
  salesTotal: number
}

export interface FormattedReorder extends Reorder {
  quantity: number
  disposible: number
  product: Product & { 
	  unit: string 
	  group: string
	  supplierName: string | null
  }
	shouldReorder?: boolean
}

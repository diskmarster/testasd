import { UserNoHash } from '@/lib/database/schema/auth'
import { CustomerID, Location, LocationID } from '@/lib/database/schema/customer'
import {
  Batch,
  DefaultPlacement,
  History,
  Inventory,
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
	'slet',
])
export type HistoryType = z.infer<typeof historyTypeZodSchema>
export const historyTypes =
  historyTypeZodSchema.options as readonly HistoryType[]
export type RegulationType = Exclude<HistoryType, 'slet'>
export const regulationTypes = historyTypes.filter(t => t != 'slet')

export const historyPlatformZodSchema = z.enum(['web', 'app', 'ext'])
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
  totalQuantity: number
	isDefaultPlacement: boolean
}

export interface FormattedDefaultPlacement extends DefaultPlacement {
	product: Product,
	placement: Placement,
	location: Location,
}

export interface ProductInventory extends Inventory {
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

export type InventoryAction = Pick<History, 'productSku' | 'productText1' | 'amount' | 'type'>

export type HistoryFilter = {
  date?: {
    from: Date,
    to: Date,
  },
  type?: HistoryType[],
	group?: string[]
}

export type MoveBetweenLocation = {
	fromLocation: string
	toLocation: string
	reference?: string
	items: {
		productID: number
		sku: string
		fromPlacementID: number
		toPlacementID?: number
		fromBatchID: number
		toBatchID?: number
		quantity: number
	}[]
}

export type MoveBetweenLocationResponse = {
	success: boolean
	errors: {
		productID: number
		message: string
	}[]
}

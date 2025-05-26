import { Inventory, Product } from '@/lib/database/schema/inventory'

export interface FormattedProduct extends Product {
  unit: string
  group: string
  fileCount?: number
  supplierName: string | null
}

export interface ProductWithInventories extends FormattedProduct {
  inventories: (Inventory & {
    locationName: string
    placementName: string
    batchName: string
  })[]
}

export const units = [
  'stk',
  'kg',
  'kasse',
  'gram',
  'pose',
  'plade',
  'meter',
  'liter',
  'ark',
  'rulle',
  'pakke',
  'm2',
  'palle',
] as const

export type ProductFilters = {
  group?: string[]
}

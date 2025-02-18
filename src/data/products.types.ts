import { Product } from '@/lib/database/schema/inventory'

export interface FormattedProduct extends Product {
  unit: string
  group: string
  fileCount?: number
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

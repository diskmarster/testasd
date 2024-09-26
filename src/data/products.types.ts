import { Product } from '@/lib/database/schema/inventory'

export interface FormattedProduct extends Product {
  unit: string
  group: string
}

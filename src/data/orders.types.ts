import { Order, OrderLine } from '@/lib/database/schema/reorders'
import { Supplier } from '@/lib/database/schema/suppliers'
import { FormattedProduct } from './products.types'

export interface FormattedOrderLine extends OrderLine {
  product: FormattedProduct
  supplier: Supplier | null
}

export interface FormattedOrder extends Order {
  lines: FormattedOrderLine[]
}

export interface OrderWithCount extends Order {
	lineCount: number
}

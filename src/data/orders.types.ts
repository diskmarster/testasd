import { Order, OrderLine } from '@/lib/database/schema/reorders'

export interface FormattedOrder extends OrderWithCount {
	lines: OrderLine[]
}

export interface OrderWithCount extends Order {
	lineCount: number
	supplierCount: number
}

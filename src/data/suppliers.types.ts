import { Supplier, SupplierHisotry } from '@/lib/database/schema/suppliers'
import { z } from 'zod'

export const supplierHistorySchema = z.enum(['oprettet', 'opdateret'])
export type SupplierHistoryType = z.infer<typeof supplierHistorySchema>
export const historyTypes =
  supplierHistorySchema.options as readonly SupplierHistoryType[]

export interface SupplierWithLogs extends Supplier {
  logs: SupplierHisotry[]
}

import { Location } from '@/lib/database/schema/customer'

export interface LocationWithCounts extends Location {
  modCount: number
  userCount: number
  outgoingCount: number
  readCount: number
}

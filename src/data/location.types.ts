import { LinkLocationToUser, Location } from '@/lib/database/schema/customer'

export interface LocationWithCounts extends Location {
	modCount: number
	userCount: number
	outgoingCount: number
	readCount: number
}

export interface LocationAccessesWithName extends LinkLocationToUser {
	locationName: string
}

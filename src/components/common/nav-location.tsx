import { hasPermissionByRank } from '@/data/user.types'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { NavLocationSelect } from './nav-location-select'

export async function NavLocation() {
	const { session, user } = await sessionService.validate()
	if (!session) return null

	let locations = await locationService.getAllActiveByUserID(user.id)

	if (hasPermissionByRank(user.role, 'administrator')) {
		let tmpLocations = await locationService.getByCustomerID(user.customerID)
		tmpLocations = tmpLocations.filter(
			loc => !locations.some(l => l.id == loc.id),
		)

		locations = [
			...tmpLocations.map(loc => ({
				...loc,
				isPrimary: false,
			})),
			...locations,
		]
	}

	if (locations.length == 0) return null

	const lastVisited = await locationService.getLastVisited(user.id)

	return <NavLocationSelect locations={locations} lastVisitedID={lastVisited} />
}

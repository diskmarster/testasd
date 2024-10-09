import { sessionService } from "@/service/session";
import { locationService } from "@/service/location";
import { NavLocationSelect } from "./nav-location-select";
import { LocationWithPrimary } from "@/lib/database/schema/customer";

export async function NavLocation() {
  const { session, user } = await sessionService.validate()
  if (!session) return null

  let locations: LocationWithPrimary[] = []

  if (user.role == 'firma_admin' || user.role == 'sys_admin') {
    const tmpLocations = await locationService.getByCustomerID(user.customerID) 
    locations = tmpLocations.map(loc => ({
      ...loc,
      isPrimary: false
    }))
  } else {
    locations = await locationService.getAllActiveByUserID(user.id)
  }

  if (locations.length == 0) return null

  const lastVisited = await locationService.getLastVisited(user.id)

  return (
    <NavLocationSelect locations={locations} lastVisitedID={lastVisited} />
  )
}

import { sessionService } from "@/service/session";
import { locationService } from "@/service/location";
import { NavLocationSelect } from "./nav-location-select";
import { LocationWithPrimary } from "@/lib/database/schema/customer";

export async function NavLocation() {
  const { session, user } = await sessionService.validate()
  if (!session) return null

  let locations = await locationService.getAllActiveByUserID(user.id)

  if (user.role == 'firma_admin' || user.role == 'sys_admin') {
    let tmpLocations = await locationService.getByCustomerID(user.customerID)
    tmpLocations = tmpLocations.filter(loc => !locations.some(l => l.id == loc.id))

    locations = [...tmpLocations.map(loc => ({
      ...loc,
      isPrimary: false
    })), ...locations]
  }

  if (locations.length == 0) return null

  const lastVisited = await locationService.getLastVisited(user.id)

  return (
    <NavLocationSelect locations={locations} lastVisitedID={lastVisited} />
  )
}

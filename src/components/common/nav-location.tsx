import { sessionService } from "@/service/session";
import { locationService } from "@/service/location";
import { NavLocationSelect } from "./nav-location-select";

export async function NavLocation() {
  const { session, user } = await sessionService.validate()
  if (!session) return null

  const locations = await locationService.getAllByUserID(user.id)
  if (locations.length == 0) return null

  const lastVisited = await locationService.getLastVisited(user.id)

  return (
    <NavLocationSelect locations={locations} lastVisitedID={lastVisited} />
  )
}

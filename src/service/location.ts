import { location } from "@/data/location";
import { LinkLocationToUserPK, Location, NewLinkLocationToUser, NewLocation } from "@/lib/database/schema/customer";

export const locationService = {
  create: async function(locationData: NewLocation): Promise<Location | undefined> {
    const newLocation = await location.create(locationData)
    if (!newLocation) return undefined
    return newLocation
  },
  addAccess: async function(newLink: NewLinkLocationToUser): Promise<boolean> {
    return await location.createAccess(newLink)
  }
}

import { location } from "@/data/location";
import { UserID } from "@/lib/database/schema/auth";
import { LinkLocationToUserPK, Location, locationTable, NewLinkLocationToUser, NewLocation } from "@/lib/database/schema/customer";

export const locationService = {
  create: async function(locationData: NewLocation): Promise<Location | undefined> {
    const newLocation = await location.create(locationData)
    if (!newLocation) return undefined
    return newLocation
  },
  addAccess: async function(newLink: NewLinkLocationToUser): Promise<boolean> {
    return await location.createAccess(newLink)
  },
  getAllByUserID: async function(userID: UserID): Promise<Location[]> {
    return await location.getAllByUserID(userID)
  }
}

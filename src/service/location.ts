import { location } from "@/data/location";
import { UserID } from "@/lib/database/schema/auth";
import { Location, LocationID, LocationWithPrimary, NewLinkLocationToUser, NewLocation } from "@/lib/database/schema/customer";
import { addDays } from "date-fns";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

const LAST_LOCATION_COOKIE_NAME = 'nl_last_location'
const LAST_LOCATION_COOKIE_DURATION_D = 14

export const locationService = {
  create: async function(locationData: NewLocation): Promise<Location | undefined> {
    const newLocation = await location.create(locationData)
    if (!newLocation) return undefined
    return newLocation
  },
  addAccess: async function(newLink: NewLinkLocationToUser): Promise<boolean> {
    return await location.createAccess(newLink)
  },
  getAllByUserID: async function(userID: UserID): Promise<LocationWithPrimary[]> {
    return await location.getAllByUserID(userID)
  },
  setCookie: function(locationID: LocationID): void {
    cookies().set(
      LAST_LOCATION_COOKIE_NAME,
      locationID.toString(),
      {
        httpOnly: true,
        secure: process.env.VERCEL_ENV === 'production',
        expires: addDays(new Date, LAST_LOCATION_COOKIE_DURATION_D)
      }
    )
  },
  deleteCookie: function(): void {
    cookies().delete(LAST_LOCATION_COOKIE_NAME)
  },
  getLastVisited: async function(userID: UserID): Promise<LocationID | undefined> {
    const locations = await location.getAllByUserID(userID)

    const locationCookie = cookies().get(LAST_LOCATION_COOKIE_NAME)

    const primaryLocation = locations.find(loc => loc.isPrimary)
    if (!primaryLocation) {
      return undefined
    }

    let defualtLocationID = locationCookie ? locationCookie.value : primaryLocation ? primaryLocation.id : locations[0].id

    if (locationCookie && !locations.find(loc => loc.id == locationCookie.value)) {
      defualtLocationID = primaryLocation.id
    }

    return defualtLocationID
  },
  toggleLocationPrimary: async function(userID: UserID, newLocationID: LocationID): Promise<boolean> {
    const didUpdate = await location.toggleLocationPrimary(userID, newLocationID)
    return didUpdate
  }
}

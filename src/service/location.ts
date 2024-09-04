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
  getCookie: function(): RequestCookie | undefined {
    const cookie = cookies().get(LAST_LOCATION_COOKIE_NAME)
    return cookie
  },
  deleteCookie: function(): void {
    cookies().delete(LAST_LOCATION_COOKIE_NAME)
  }
}

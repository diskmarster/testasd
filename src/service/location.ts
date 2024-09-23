import { location } from '@/data/location'
import { UserID } from '@/lib/database/schema/auth'
import {
  Location,
  LocationID,
  LocationWithPrimary,
  NewLinkLocationToUser,
  NewLocation,
} from '@/lib/database/schema/customer'
import { addDays } from 'date-fns'
import { cookies } from 'next/headers'

const LAST_LOCATION_COOKIE_NAME = 'nl_last_location'
const LAST_LOCATION_COOKIE_DURATION_D = 14

export const locationService = {
  create: async function(
    locationData: NewLocation,
  ): Promise<Location | undefined> {
    const newLocation = await location.create(locationData)
    if (!newLocation) return undefined
    return newLocation
  },
  addAccess: async function(newLink: NewLinkLocationToUser): Promise<boolean> {
    return await location.createAccess(newLink)
  },
  getAllByUserID: async function(
    userID: UserID,
  ): Promise<LocationWithPrimary[]> {
    return await location.getAllByUserID(userID)
  },
  setCookie: function(locationID: LocationID): void {
    cookies().set(LAST_LOCATION_COOKIE_NAME, locationID.toString(), {
      httpOnly: true,
      secure: process.env.VERCEL_ENV === 'production',
      expires: addDays(new Date(), LAST_LOCATION_COOKIE_DURATION_D),
    })
  },
  deleteCookie: function(): void {
    cookies().delete(LAST_LOCATION_COOKIE_NAME)
  },
  getLastVisited: async function(
    userID: UserID,
  ): Promise<LocationID | undefined> {
    let defaultLocationID
    const locations = await location.getAllByUserID(userID)
    if (locations.length == 0) return undefined

    const locationCookie = cookies().get(LAST_LOCATION_COOKIE_NAME)
    const primaryLocation = locations.find(loc => loc.isPrimary)
    if (!primaryLocation) {
      defaultLocationID = locations[0].id
    } else {
      defaultLocationID = primaryLocation.id
    }

    if (locationCookie) {
      const cookieLocationExists = locations.some(
        loc => loc.id === locationCookie.value,
      )
      defaultLocationID = cookieLocationExists
        ? locationCookie.value
        : defaultLocationID
    }

    return defaultLocationID
  },
  toggleLocationPrimary: async function(
    userID: UserID,
    newLocationID: LocationID,
  ): Promise<boolean> {
    const didUpdate = await location.toggleLocationPrimary(
      userID,
      newLocationID,
    )
    return didUpdate
  },
  getByID: async function(
    locationID: LocationID,
  ): Promise<Location | undefined> {
    return await location.getByID(locationID)
  },
}

import { db } from "@/lib/database";
import { UserID } from "@/lib/database/schema/auth";
import { CustomerID, linkLocationToUserTable, Location, LocationID, locationTable, LocationWithPrimary, NewLinkLocationToUser, NewLocation } from "@/lib/database/schema/customer";
import { eq, and, getTableColumns } from "drizzle-orm";

export const location = {
  create: async function(locationData: NewLocation): Promise<Location | undefined> {
    const newLocation = await db.insert(locationTable).values(locationData).returning()
    if (newLocation.length != 1) return undefined
    return newLocation[0]
  },
  getAllByCustomerID: async function(customerID: CustomerID): Promise<Location[]> {
    const locations = await db.select().from(locationTable).where(eq(locationTable.customerID, customerID))
    return locations
  },
  getAllByUserID: async function(userID: UserID): Promise<LocationWithPrimary[]> {
    const locationCols = getTableColumns(locationTable)
    const locations = await db
      .select({ ...locationCols, isPrimary: linkLocationToUserTable.isPrimary })
      .from(linkLocationToUserTable)
      .where(eq(linkLocationToUserTable.userID, userID))
      .innerJoin(locationTable, eq(locationTable.id, linkLocationToUserTable.locationID))
    return locations
  },
  createAccess: async function(newLink: NewLinkLocationToUser): Promise<boolean> {
    const resultSet = await db.insert(linkLocationToUserTable).values(newLink)
    return resultSet.rowsAffected == 1
  },
  getPrimary: async function(userID: UserID): Promise<Location | undefined> {
    const locationCols = getTableColumns(locationTable)
    const location = await db
      .select({ ...locationCols })
      .from(linkLocationToUserTable)
      .where(and(eq(linkLocationToUserTable.userID, userID), eq(linkLocationToUserTable.isPrimary, true)))
      .innerJoin(locationTable, eq(locationTable.id, linkLocationToUserTable.locationID))
      .limit(1)
    if (location.length != 1) return undefined
    return location[0]
  },
  toggleLocationPrimary: async function(userID: UserID, locationID: LocationID): Promise<boolean> {
    const resultSet = await db.transaction(async (tsx) => {
      await tsx
        .update(linkLocationToUserTable)
        .set({ isPrimary: false })
        .where(and(
          eq(linkLocationToUserTable.userID, userID),
          eq(linkLocationToUserTable.isPrimary, true)
        ))

      const updateNewLocation = await tsx
        .update(linkLocationToUserTable)
        .set({ isPrimary: true })
        .where(and(
          eq(linkLocationToUserTable.locationID, locationID),
          eq(linkLocationToUserTable.userID, userID)
        ))
      return updateNewLocation
    })
    return resultSet.rowsAffected == 1
  }
}

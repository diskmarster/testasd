import { db } from "@/lib/database";
import { UserID } from "@/lib/database/schema/auth";
import { CustomerID, linkLocationToUserTable, Location, locationTable, NewLinkLocationToUser, NewLocation } from "@/lib/database/schema/customer";
import { desc, eq, getTableColumns } from "drizzle-orm";

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
  getAllByUserID: async function(userID: UserID): Promise<(Location & { lastSelected: Date })[]> {
    const locationCols = getTableColumns(locationTable)
    const locations = await db
      .select({ ...locationCols, lastSelected: linkLocationToUserTable.lastSelected })
      .from(linkLocationToUserTable)
      .where(eq(linkLocationToUserTable.userID, userID))
      .innerJoin(locationTable, eq(locationTable.id, linkLocationToUserTable.locationID))
    return locations
  },
  createAccess: async function(newLink: NewLinkLocationToUser): Promise<boolean> {
    const resultSet = await db.insert(linkLocationToUserTable).values(newLink)
    return resultSet.rowsAffected == 1
  },
  getLastVisited: async function(userID: UserID): Promise<Location | undefined> {
    const locationCols = getTableColumns(locationTable)
    const location = await db
      .select({ ...locationCols })
      .from(linkLocationToUserTable)
      .where(eq(linkLocationToUserTable.userID, userID))
      .innerJoin(locationTable, eq(locationTable.id, linkLocationToUserTable.locationID))
      .orderBy(desc(linkLocationToUserTable.lastSelected))
      .limit(1)
    if (location.length != 1) return undefined
    return location[0]
  }
}

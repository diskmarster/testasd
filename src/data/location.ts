import { db, TRX } from "@/lib/database";
import { UserID } from "@/lib/database/schema/auth";
import { CustomerID, linkLocationToUserTable, Location, LocationID, locationTable, LocationWithPrimary, NewLinkLocationToUser, NewLocation } from "@/lib/database/schema/customer";
import { eq, and, getTableColumns } from "drizzle-orm";


export const location = {
  create: async function(locationData: NewLocation, trx: TRX = db): Promise<Location | undefined> {
    const newLocation = await trx.insert(locationTable).values(locationData).returning()
    return newLocation[0]
  },
  getAllByCustomerID: async function(customerID: CustomerID, trx: TRX = db): Promise<Location[]> {
    const locations = await trx.select().from(locationTable).where(eq(locationTable.customerID, customerID))
    return locations
  },
  getAllByUserID: async function(userID: UserID, trx: TRX = db): Promise<LocationWithPrimary[]> {
    const locationCols = getTableColumns(locationTable)
    const locations = await trx
      .select({ ...locationCols, isPrimary: linkLocationToUserTable.isPrimary })
      .from(linkLocationToUserTable)
      .where(eq(linkLocationToUserTable.userID, userID))
      .innerJoin(locationTable, eq(locationTable.id, linkLocationToUserTable.locationID))
    return locations
  },
  createAccess: async function(newLink: NewLinkLocationToUser, trx: TRX = db): Promise<boolean> {
    const resultSet = await trx.insert(linkLocationToUserTable).values(newLink)
    return resultSet.rowsAffected == 1
  },
  getPrimary: async function(userID: UserID, trx: TRX = db): Promise<Location | undefined> {
    const locationCols = getTableColumns(locationTable)
    const location = await trx
      .select({ ...locationCols })
      .from(linkLocationToUserTable)
      .where(and(eq(linkLocationToUserTable.userID, userID), eq(linkLocationToUserTable.isPrimary, true)))
      .innerJoin(locationTable, eq(locationTable.id, linkLocationToUserTable.locationID))
      .limit(1)
    return location[0]
  },
  toggleLocationPrimary: async function(userID: UserID, locationID: LocationID, trx: TRX = db): Promise<boolean> {
    await trx
      .update(linkLocationToUserTable)
      .set({ isPrimary: false })
      .where(and(
        eq(linkLocationToUserTable.userID, userID),
        eq(linkLocationToUserTable.isPrimary, true)
      ))

    const resultSet = await trx
      .update(linkLocationToUserTable)
      .set({ isPrimary: true })
      .where(and(
        eq(linkLocationToUserTable.locationID, locationID),
        eq(linkLocationToUserTable.userID, userID)
      ))
    return resultSet.rowsAffected == 1
  }
}

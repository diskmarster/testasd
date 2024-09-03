import { db } from "@/lib/database";
import { CustomerID, Location, locationsTable, NewLocation } from "@/lib/database/schema/customer";
import { eq } from "drizzle-orm";

export const location = {
  create: async function(locationData: NewLocation): Promise<Location | undefined> {
    const newLocation = await db.insert(locationsTable).values(locationData).returning()
    if (newLocation.length != 1) return undefined
    return newLocation[0]
  },
  getAllByCustomerID: async function(customerID: CustomerID): Promise<Location[]> {
    const locations = await db.select().from(locationsTable).where(eq(locationsTable.customerID, customerID))
    return locations
  }
}

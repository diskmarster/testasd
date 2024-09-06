import { db, TRX } from "@/lib/database"
import { LocationID } from "@/lib/database/schema/customer"
import { inventoryTable } from "@/lib/database/schema/inventory"
import { eq } from "drizzle-orm"

export const inventory = {
  getInventoryByLocationID: async function(locationID: LocationID, trx: TRX = db) {
    const todo = await db
      .select()
      .from(inventoryTable)
      .where(eq(inventoryTable.locationID, locationID))
  }
}

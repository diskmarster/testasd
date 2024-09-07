import { db, TRX } from "@/lib/database"
import { LocationID } from "@/lib/database/schema/customer"
import { batchTable, inventoryTable, placementTable, productTable, unitTable } from "@/lib/database/schema/inventory"
import { eq, getTableColumns } from "drizzle-orm"
import { FormattedInventory } from "./inventory.types"

const PRODUCT_COLS = getTableColumns(productTable)
const PLACEMENT_COLS = getTableColumns(placementTable)
const BATCH_COLS = getTableColumns(batchTable)
const UNIT_COLS = getTableColumns(unitTable)

export const inventory = {
  getInventoryByLocationID: async function(locationID: LocationID, trx: TRX = db): Promise<FormattedInventory[]> {
    const inventory: FormattedInventory[] = await trx
      .select({
        inserted: inventoryTable.inserted,
        updated: inventoryTable.updated,
        quantity: inventoryTable.quantity,
        customerID: inventoryTable.customerID,
        locationID: inventoryTable.locationID,
        product: { ...PRODUCT_COLS, unit: UNIT_COLS.name },
        placement: { ...PLACEMENT_COLS },
        batch: { ...BATCH_COLS }
      })
      .from(inventoryTable)
      .where(eq(inventoryTable.locationID, locationID))
      .innerJoin(productTable, eq(productTable.id, inventoryTable.productID))
      .innerJoin(placementTable, eq(placementTable.id, inventoryTable.placementID))
      .innerJoin(batchTable, eq(batchTable.id, inventoryTable.batchID))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))

    return inventory
  }
}

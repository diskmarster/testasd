import { db, TRX } from "@/lib/database"
import { CustomerID, LocationID } from "@/lib/database/schema/customer"
import { batchTable, Group, groupTable, inventoryTable, placementTable, productTable, Unit, unitTable } from "@/lib/database/schema/inventory"
import { and, eq, getTableColumns } from "drizzle-orm"
import { FormattedInventory } from "./inventory.types"

const PRODUCT_COLS = getTableColumns(productTable)
const PLACEMENT_COLS = getTableColumns(placementTable)
const BATCH_COLS = getTableColumns(batchTable)
const UNIT_COLS = getTableColumns(unitTable)
const GROUP_COLS = getTableColumns(groupTable)

export const inventory = {
  getInventoryByLocationID: async function(locationID: LocationID, trx: TRX = db): Promise<FormattedInventory[]> {
    const inventory: FormattedInventory[] = await trx
      .select({
        inserted: inventoryTable.inserted,
        updated: inventoryTable.updated,
        quantity: inventoryTable.quantity,
        customerID: inventoryTable.customerID,
        locationID: inventoryTable.locationID,
        product: { ...PRODUCT_COLS, unit: UNIT_COLS.name, group: GROUP_COLS.name },
        placement: { ...PLACEMENT_COLS },
        batch: { ...BATCH_COLS }
      })
      .from(inventoryTable)
      .where(eq(inventoryTable.locationID, locationID))
      .innerJoin(productTable, eq(productTable.id, inventoryTable.productID))
      .innerJoin(placementTable, eq(placementTable.id, inventoryTable.placementID))
      .innerJoin(batchTable, eq(batchTable.id, inventoryTable.batchID))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
      .innerJoin(groupTable, eq(groupTable.id, productTable.groupID))

    return inventory
  },
  getUnits: async function(trx: TRX = db): Promise<Unit[]> {
    return await trx
      .select()
      .from(unitTable)
      .where(eq(unitTable.isBarred, false))
  },
  getGroupsByCustomerID: async function(customerID: CustomerID, trx: TRX = db): Promise<Group[]> {
    return await trx
      .select()
      .from(groupTable)
      .where(
        and(
          eq(groupTable.isBarred, false),
          eq(groupTable.customerID, customerID)
        )
      )
  }
}

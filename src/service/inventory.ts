import { inventory } from "@/data/inventory";
import { FormattedInventory } from "@/data/inventory.types";
import { CustomerID, LocationID } from "@/lib/database/schema/customer";
import { Batch, Group, Placement, Unit } from "@/lib/database/schema/inventory";

export const inventoryService = {
  getInventory: async function(locationID: LocationID): Promise<FormattedInventory[]> {
    return await inventory.getInventoryByLocationID(locationID)
  },
  getUnits: async function(): Promise<Unit[]> {
    return inventory.getUnits()
  },
  getGroupsByID: async function(customerID: CustomerID): Promise<Group[]> {
    return await inventory.getGroupsByID(customerID)
  },
  getPlacementsByID: async function(locationID: LocationID): Promise<Placement[]> {
    return await inventory.getPlacementsByID(locationID)
  },
  getBatchesByID: async function(locationID: LocationID): Promise<Batch[]> {
    return await inventory.getBatchesByID(locationID)
  }
}

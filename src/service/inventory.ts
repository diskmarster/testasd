import { inventory } from "@/data/inventory";
import { FormattedInventory } from "@/data/inventory.types";
import { LocationID } from "@/lib/database/schema/customer";

export const inventoryService = {
  getInventory: async function(locationID: LocationID): Promise<FormattedInventory[]> {
    return await inventory.getInventoryByLocationID(locationID)
  }
}

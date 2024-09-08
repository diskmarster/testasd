import { CustomerID, LocationID } from "@/lib/database/schema/customer";
import { Batch, Placement, Product } from "@/lib/database/schema/inventory";
import { z } from "zod";

export const historyTypeZodSchema = z.enum(['tilgang', 'afgang', 'regulering']);
export type HistoryType = z.infer<typeof historyTypeZodSchema>;
export const historyTypes = historyTypeZodSchema.options as readonly HistoryType[];

export type FormattedInventory = {
  inserted: Date
  updated: Date
  quantity: number
  customerID: CustomerID
  locationID: LocationID
  product: Product & { unit: string, group: string }
  placement: Placement
  batch: Batch
}

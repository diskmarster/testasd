import { db } from "@/lib/database";
import { CustomerID } from "@/lib/database/schema/customer";
import { Product, productTable } from "@/lib/database/schema/inventory";
import { eq } from "drizzle-orm";

export const product = {
  getAllProducts: async (customerID: CustomerID): Promise<Product[]> => {
    return await db
      .select()
      .from(productTable)
      .where(eq(productTable.customerID, customerID))
  },
}

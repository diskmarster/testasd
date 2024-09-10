import { product } from "@/data/product";
import { CustomerID } from "@/lib/database/schema/customer";
import { Product } from "@/lib/database/schema/inventory";

export const productService = {
  getAllProducts: async (customerID: CustomerID): Promise<Product[]> => {
    return await product.getAllProducts(customerID)
  }
}

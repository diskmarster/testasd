import { product } from "@/data/product";
import { CustomerID } from "@/lib/database/schema/customer";
import { Product } from "@/lib/database/schema/inventory";

export const productService = {
  getAllProducts: async (customerID: CustomerID): Promise<Product[]> => {
    try {
      return await product.getAllProducts(customerID)
    } catch(e) {
      console.error(e)
      Promise.reject(`Error getting products from database ${JSON.stringify(e, null, 2)}`)
      return []
    }
  }
}

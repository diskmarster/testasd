import { product } from "@/data/product";
import { CustomerID } from "@/lib/database/schema/customer";
import { Product } from "@/lib/database/schema/inventory";

export const productService = {
  getAllProducts: (customerID: CustomerID): Promise<Product[]> | undefined => {
    try {
      return product.getAllProducts(customerID)
    } catch(e) {
      console.error("Error getting products from database", JSON.stringify(e, null, 2))
      Promise.reject(`Error getting products from database ${JSON.stringify(e, null, 2)}`)
    }
  }
}

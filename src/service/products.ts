import { product } from '@/data/products'
import { CustomerID } from '@/lib/database/schema/customer'
import { Inventory, NewProduct, Product } from '@/lib/database/schema/inventory'
import { ActionError } from '@/lib/safe-action/error'
import { LibsqlError } from '@libsql/client'
import { inventoryService } from './inventory'

export const productService = {
  create: async function(
    productData: NewProduct,
  ): Promise<Product | undefined> {
    try {
      const newProduct = await product.create(productData)
      if (!newProduct) return undefined
      return newProduct
    } catch (err) {
      if (err instanceof LibsqlError) {
        if (err.message.includes('barcode')) {
          throw new ActionError('Stregkoden findes allerede')
        }
        if (err.message.includes('sku')) {
          throw new ActionError('Varenr. findes allerede')
        }
      }
    }
  },
  getAllProducts: async (
    customerID: CustomerID,
  ): Promise<(Product & { unit: string; group: string })[]> => {
    try {
      return await product.getAllProducts(customerID)
    } catch (e) {
      console.error(e)
      Promise.reject(
        `Error getting products from database ${JSON.stringify(e, null, 2)}`,
      )
      return []
    }
  },
  getAllProductsWithInventories: async (
    customerID: CustomerID,
  ): Promise<
    (Product & { unit: string; group: string; inventories: Inventory[] })[]
  > => {
    try {
      const products = await product.getAllProducts(customerID)

      return await Promise.all(
        products.map(async p => {
          const inventories = await inventoryService.getInventoryByProductID(
            p.id,
          )

          return {
            ...p,
            inventories,
          }
        }),
      )
    } catch (e) {
      console.error(e)
      Promise.reject(
        `Error getting products from database ${JSON.stringify(e, null, 2)}`,
      )
      return []
    }
  },
}

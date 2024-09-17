import { FormattedProduct, product, products} from '@/data/products'
import { CustomerID } from '@/lib/database/schema/customer'
import { NewProduct, Product } from '@/lib/database/schema/inventory'

import { ActionError } from '@/lib/safe-action/error'
import { LibsqlError } from '@libsql/client'

export const productService = {
  create: async function (
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
  getAllByID: async function (
    customerID: CustomerID,
  ): Promise<FormattedProduct[]> {
    return await products.getAllByCustomerID(customerID)
  },
}

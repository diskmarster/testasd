import { product } from '@/data/products'
import { NewProduct, Product } from '@/lib/database/schema/inventory'

export const productService = {
  create: async function (
    productData: NewProduct,
  ): Promise<Product | undefined> {
    const newProduct = await product.create(productData)
    if (!newProduct) return undefined
    return newProduct
  },
}

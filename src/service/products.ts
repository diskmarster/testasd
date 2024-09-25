import { inventory } from '@/data/inventory'
import { location } from '@/data/location'
import { product } from '@/data/products'
import { FormattedProduct } from '@/data/products.types'
import { db } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
  NewInventory,
  NewProduct,
  PartialProduct,
  Product,
  ProductID,
} from '@/lib/database/schema/inventory'

import { ActionError } from '@/lib/safe-action/error'
import { LibsqlError } from '@libsql/client'

export const productService = {
  create: async function (
    productData: NewProduct,
    customerID: CustomerID,
  ): Promise<Product | undefined> {
    try {
      const transaction = await db.transaction(async trx => {
        const newProduct = await product.create(productData, trx)
        if (!newProduct) return undefined
        const locations = await location.getAllByCustomerID(customerID, trx)
        for (const location of locations) {
          const defaultPlacement = await inventory.getDefaultPlacementByID(
            location.id,
            trx,
          )
          const defaultBatch = await inventory.getDefaultBatchByID(
            location.id,
            trx,
          )

          let placementID = defaultPlacement?.id
          let batchID = defaultBatch?.id
          if (!defaultPlacement) {
            const newDefaultPlacement = await inventory.createPlacement(
              {
                name: '-',
                locationID: location.id,
              },
              trx,
            )
            placementID = newDefaultPlacement.id
          }
          if (!defaultBatch) {
            const newBatch = await inventory.createBatch(
              { batch: '-', locationID: location.id },
              trx,
            )
            batchID = newBatch.id
          }
          const newInventoryData: NewInventory = {
            productID: newProduct.id,
            placementID: placementID,
            batchID: batchID,
            quantity: 0,
            customerID: customerID,
            locationID: location.id,
          }
          const newInventory = await inventory.upsertInventory(
            newInventoryData,
            trx,
          )
        }
        return newProduct
      })

      return transaction
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
    return await product.getAllByCustomerID(customerID)
  },

  updateByID: async function (
    productID: ProductID,
    updatedProductData: PartialProduct,
  ): Promise<Product | undefined> {
    try {
      const updatedProduct = await product.updateByID(
        productID,
        updatedProductData,
      )
      if (!updatedProduct) return undefined
      return updatedProduct
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
  async updateBarredStatus(
    productID: ProductID,
    isBarred: boolean,
  ): Promise<Product | undefined> {
    try {
      const updatedProduct = await product.updateByID(productID, { isBarred })
      if (!updatedProduct) return undefined
      return updatedProduct
    } catch (err) {
      console.error('Error updating barred status:', err)
      throw new ActionError('Failed to update product bar status')
    }
  },
}

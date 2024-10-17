import { inventory } from '@/data/inventory'
import { location } from '@/data/location'
import { product } from '@/data/products'
import { FormattedProduct } from '@/data/products.types'
import { db, TRX } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
    Group,
  Inventory,
  NewInventory,
  NewProduct,
  PartialProduct,
  Product,
  ProductID,
  Unit,
} from '@/lib/database/schema/inventory'

import { ActionError } from '@/lib/safe-action/error'
import { LibsqlError } from '@libsql/client'
import { inventoryService } from './inventory'
import { ImportProducts } from '@/app/(site)/admin/produkter/validation'

export const productService = {
  create: async function(
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
  getAllProductsWithInventories: async function (
    customerID: CustomerID,
  ): Promise<
    (Product & { unit: string; group: string; inventories: Inventory[] })[]
  > {
    try {
      const products = await product.getAllByCustomerID(customerID)

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
  getAllByCustomerID: async function(
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<FormattedProduct[]> {
    return await product.getAllByCustomerID(customerID, trx)
  },
  updateByID: async function(
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
  updateBarredStatus: async function (
    productID: ProductID,
    isBarred: boolean,
  ): Promise<Product | undefined> {
    try {
      const updatedProduct = await product.updateByID(productID, { isBarred })
      if (!updatedProduct) return undefined
      return updatedProduct
    } catch (err) {
      console.error('Der skete en fejl med spærringen:', err)
      throw new ActionError(
        'Der skete en fejl med opdatering af produkt spærringen',
      )
    }
  },
  getByID: async function (
    id: ProductID,
  ): Promise<(FormattedProduct & { inventories: Inventory[] }) | undefined> {
    try {
      const p = await product.getByID(id)
      if (p == undefined) {
        return undefined
      }

      const inventories = await inventoryService.getInventoryByProductID(id)

      return {
        ...p,
        inventories,
      }
    } catch (e) {
      console.error(`ERROR: Trying to get product by id failed: ${e}`)
      throw new ActionError(`Kunne ikke finde produkt med id ${id}`)
    }
  },
  importProducts: async function(customerID: CustomerID, importedProducts: ImportProducts): Promise<boolean> {
    const transaction = await db.transaction(async trx => {

      const [units, groups, products, locations] = await Promise.all([
        inventory.getAllUnits(trx),
        inventory.getAllGroupsByID(customerID, trx),
        inventory.getAllProductsByID(customerID, trx),
        location.getAllByCustomerID(customerID, trx)
      ])

      const productsMap = new Map<string, Product>(products.map(p => [p.sku, p]))
      let existingProductsPromises = []
      let newProductsPromises = []

      const groupsMap = new Map<string, Group>(groups.map(g => [g.name, g]))

      const defaultPlacementMap = new Map<string, number>()
      let newDefaultPlacementPromises = []

      const defaultBatchMap = new Map<string, number>()
      let newDefaultBatchPromises = []

      for (const loc of locations) {
        const [defaultPlacement, defaultBatch] = await Promise.all([
          inventory.getDefaultPlacementByID(loc.id, trx),
          inventory.getDefaultBatchByID(loc.id, trx)
        ])

        if (defaultPlacement) {
          defaultPlacementMap.set(loc.id, defaultPlacement.id)
        } else {
          newDefaultPlacementPromises.push(inventory.createPlacement(
            {
              name: '-',
              locationID: loc.id,
            },
            trx,
          ))
        }

        if (defaultBatch) {
          defaultBatchMap.set(loc.id, defaultBatch.id)
        } else {
          newDefaultBatchPromises.push(inventory.createBatch(
            {
              batch: '-',
              locationID: loc.id,
            },
            trx,
          ))
        }
      }

      const [newDefaultPlacements, newDefaultBatches] = await Promise.all([
        Promise.all(newDefaultPlacementPromises),
        Promise.all(newDefaultBatchPromises)
      ])

      newDefaultPlacements.forEach(p => defaultPlacementMap.set(p.locationID, p.id))
      newDefaultBatches.forEach(b => defaultBatchMap.set(b.locationID, b.id))

      for (const p of importedProducts) {

        if (!groupsMap.has(p.group)) {
          const newGroup = await inventory.createProductGroup({
            name: p.group,
            customerID: customerID
          }, trx)
          groups.push(newGroup)
          groupsMap.set(newGroup.name, newGroup)
        }

        if (productsMap.has(p.sku)) {
          
          existingProductsPromises.push(
            product.upsertProduct({
              customerID: customerID,
              groupID: groupsMap.get(p.group)?.id!,
              unitID: units.find(u => u.name == p.unit)?.id ?? units[0].id,
              text1: p.text1,
              sku: p.sku,
              barcode: p.barcode,
              costPrice: p.costPrice,
              isBarred: p.isBarred,
              text2: p.text2,
              text3: p.text3,
              salesPrice: p.salesPrice
            }, trx)
          )

        } else {

          newProductsPromises.push(
            product.upsertProduct({
              customerID: customerID,
              groupID: groupsMap.get(p.group)?.id!,
              unitID: units.find(u => u.name == p.unit)?.id ?? units[0].id,
              text1: p.text1,
              sku: p.sku,
              barcode: p.barcode,
              costPrice: p.costPrice,
              isBarred: p.isBarred,
              text2: p.text2,
              text3: p.text3,
              salesPrice: p.salesPrice
            }, trx)
          )

        }
      }

      const [newProductsResponses, ] = await Promise.all([
        Promise.all(newProductsPromises),
        Promise.all(existingProductsPromises)
      ])

      const zeroInventoryPromises = []

      for (const loc of locations) {
        for (const prod of newProductsResponses) {
          zeroInventoryPromises.push(
            inventory.upsertInventory({
              customerID,
              productID: prod.id,
              locationID: loc.id,
              placementID: defaultPlacementMap.get(loc.id)!,
              batchID: defaultBatchMap.get(loc.id)!,
              quantity: 0
            }, trx)
          )
        }
      }

      await Promise.all(zeroInventoryPromises)

      return true
    })
    return transaction
  },
}

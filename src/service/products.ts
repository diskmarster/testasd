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
  NewProductHistory,
  PartialProduct,
  Product,
  ProductHistory,
  ProductID,
} from '@/lib/database/schema/inventory'

import { ImportProducts } from '@/app/[lng]/(site)/admin/produkter/validation'
import { serverTranslation } from '@/app/i18n'
import { fallbackLng } from '@/app/i18n/settings'
import { user as userData } from '@/data/user'
import { UserID } from '@/lib/database/schema/auth'
import {
  ACTION_ERR_INTERNAL,
  ACTION_ERR_UNAUTHORIZED,
  ActionError,
} from '@/lib/safe-action/error'
import { LibsqlError } from '@libsql/client'
import { inventoryService } from './inventory'

export const productService = {
  create: async function (
    productData: NewProduct,
    customerID: CustomerID,
    userID: UserID,
    lang: string = fallbackLng,
  ): Promise<Product | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')
    try {
      const transaction = await db.transaction(async trx => {
        const userUnitAndGroupPromise = Promise.all([
          userData.getByID(userID, trx),
          inventory.getUnitByID(productData.unitID, trx),
          inventory.getGroupByID(productData.groupID, trx),
        ])

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

        const [user, unit, group] = await userUnitAndGroupPromise

        await product.createHistoryLog(
          {
            userID: user?.id!,
            userName: user?.name!,
            userRole: user?.role!,
            customerID,
            productID: newProduct.id,
            productUnitName: unit?.name!,
            productGroupName: group?.name!,
            productText1: newProduct.text1,
            productSku: newProduct.sku,
            productBarcode: newProduct.barcode,
            productCostPrice: newProduct.costPrice,
            productIsBarred: newProduct.isBarred,
            productText2: newProduct.text2,
            productText3: newProduct.text3,
            productSalesPrice: newProduct.salesPrice,
            productNote: newProduct.note,
            type: 'oprettelse',
            isImport: false,
          },
          trx,
        )

        return newProduct
      })

      return transaction
    } catch (err) {
      if (err instanceof LibsqlError) {
        if (err.message.includes('barcode')) {
          throw new ActionError(
            t('product-service-action-barcode-already-exists'),
          )
        }
        if (err.message.includes('sku')) {
          throw new ActionError(t('product-service-action-sku-already-exists'))
        }
      }
      throw new ActionError(ACTION_ERR_INTERNAL)
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
  getAllByCustomerID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<FormattedProduct[]> {
    return await product.getAllByCustomerID(customerID, trx)
  },
  updateByID: async function (
    productID: ProductID,
    updatedProductData: PartialProduct,
    userID: UserID,
    lang: string = fallbackLng,
  ): Promise<Product | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')
    return await db.transaction(async trx => {
      try {
        const updatedProduct = await product.updateByID(
          productID,
          updatedProductData,
          trx,
        )
        if (!updatedProduct) return undefined

        const [user, unit, group] = await Promise.all([
          userData.getByID(userID, trx),
          inventory.getUnitByID(updatedProduct.unitID, trx),
          inventory.getGroupByID(updatedProduct.groupID, trx),
        ])

        await product.createHistoryLog(
          {
            userID: user?.id!,
            userName: user?.name!,
            userRole: user?.role!,
            customerID: user?.customerID!,
            productID: updatedProduct.id,
            productUnitName: unit?.name!,
            productGroupName: group?.name!,
            productText1: updatedProduct.text1,
            productSku: updatedProduct.sku,
            productBarcode: updatedProduct.barcode,
            productCostPrice: updatedProduct.costPrice,
            productIsBarred: updatedProduct.isBarred,
            productText2: updatedProduct.text2,
            productText3: updatedProduct.text3,
            productSalesPrice: updatedProduct.salesPrice,
            productNote: updatedProduct.note,
            type: 'opdatering',
            isImport: false,
          },
          trx,
        )

        return updatedProduct
      } catch (err) {
        console.error(err)
        if (err instanceof LibsqlError) {
          if (err.message.includes('barcode')) {
            throw new ActionError(
              t('product-service-action.barcode-already-exists'),
            )
          }
          if (err.message.includes('sku')) {
            throw new ActionError(
              t('product-service-action.sku-already-exists'),
            )
          }
        }
        throw new ActionError(ACTION_ERR_INTERNAL)
      }
    })
  },
  updateBarredStatus: async function (
    productID: ProductID,
    isBarred: boolean,
    userID: UserID,
    lang: string = fallbackLng,
  ): Promise<Product | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')
    return await db.transaction(async trx => {
      try {
        const updatedProduct = await product.updateByID(productID, { isBarred })
        if (!updatedProduct) return undefined
        const [user, unit, group] = await Promise.all([
          userData.getByID(userID, trx),
          inventory.getUnitByID(updatedProduct.unitID, trx),
          inventory.getGroupByID(updatedProduct.groupID, trx),
        ])

        await product.createHistoryLog(
          {
            userID: user?.id!,
            userName: user?.name!,
            userRole: user?.role!,
            customerID: user?.customerID!,
            productID: updatedProduct.id,
            productUnitName: unit?.name!,
            productGroupName: group?.name!,
            productText1: updatedProduct.text1,
            productSku: updatedProduct.sku,
            productBarcode: updatedProduct.barcode,
            productCostPrice: updatedProduct.costPrice,
            productIsBarred: updatedProduct.isBarred,
            productText2: updatedProduct.text2,
            productText3: updatedProduct.text3,
            productSalesPrice: updatedProduct.salesPrice,
            productNote: updatedProduct.note,
            type: 'spærring',
            isImport: false,
          },
          trx,
        )
        return updatedProduct
      } catch (err) {
        console.error('Der skete en fejl med spærringen:', err)
        throw new ActionError(
          t('product-service-action.product-barring-failed'),
        )
      }
    })
  },
  getByID: async function (
    id: ProductID,
    lang: string = fallbackLng,
  ): Promise<(FormattedProduct & { inventories: Inventory[] }) | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')
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
      throw new ActionError(
        `${t('product-service-action.product-id-not-found')} ${id}`,
      )
    }
  },
  importProducts: async function (
    customerID: CustomerID,
    userID: UserID,
    importedProducts: ImportProducts,
  ): Promise<boolean> {
    const start = performance.now()
    const transaction = await db.transaction(async trx => {
      const [units, groups, products, locations, importingUser] =
        await Promise.all([
          inventory.getAllUnits(trx),
          inventory.getAllGroupsByID(customerID, trx),
          inventory.getAllProductsByID(customerID, trx),
          location.getAllByCustomerID(customerID, trx),
          userData.getByID(userID, trx),
        ])

      if (!importingUser) {
        throw new ActionError(ACTION_ERR_UNAUTHORIZED)
      }

      const productsMap = new Map<string, Product>(
        products.map(p => [p.sku.toUpperCase(), p]),
      )
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
          inventory.getDefaultBatchByID(loc.id, trx),
        ])

        if (defaultPlacement) {
          defaultPlacementMap.set(loc.id, defaultPlacement.id)
        } else {
          newDefaultPlacementPromises.push(
            inventory.createPlacement(
              {
                name: '-',
                locationID: loc.id,
              },
              trx,
            ),
          )
        }

        if (defaultBatch) {
          defaultBatchMap.set(loc.id, defaultBatch.id)
        } else {
          newDefaultBatchPromises.push(
            inventory.createBatch(
              {
                batch: '-',
                locationID: loc.id,
              },
              trx,
            ),
          )
        }
      }

      const [newDefaultPlacements, newDefaultBatches] = await Promise.all([
        Promise.all(newDefaultPlacementPromises),
        Promise.all(newDefaultBatchPromises),
      ])

      newDefaultPlacements.forEach(p =>
        defaultPlacementMap.set(p.locationID, p.id),
      )
      newDefaultBatches.forEach(b => defaultBatchMap.set(b.locationID, b.id))

      for (const p of importedProducts) {
        if (!groupsMap.has(p.group)) {
          const newGroup = await inventory.createProductGroup(
            {
              name: p.group,
              customerID: customerID,
            },
            trx,
          )
          groups.push(newGroup)
          groupsMap.set(newGroup.name, newGroup)
        }

        if (productsMap.has(p.sku)) {
          const currentProd = productsMap.get(p.sku)!
          existingProductsPromises.push(
            product.updateByID(
              currentProd.id!,
              {
                customerID: customerID,
                groupID: groupsMap.get(p.group)?.id!,
                unitID: units.find(u => u.name.toLowerCase() == p.unit.toLowerCase())?.id ?? units[0].id,
                text1: p.text1,
                sku: p.sku,
                barcode: p.barcode,
                costPrice: p.costPrice,
                isBarred: p.isBarred,
                text2: p.text2,
                text3: p.text3,
                salesPrice: p.salesPrice,
              },
              trx,
            ),
          )
        } else {
          newProductsPromises.push(
            product
              .create(
                {
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
                  salesPrice: p.salesPrice,
                },
                trx,
              )
              .catch(e => {
                if (e instanceof LibsqlError) {
                  if (e.message.includes('barcode')) {
                    throw new ActionError(
                      `Stregkoden '${p.barcode}' findes allerede`,
                    )
                  }
                  if (e.message.includes('sku')) {
                    throw new ActionError(`Varenr. '${p.sku}' findes allerede`)
                  }
                }

                throw new ActionError(
                  `Kunne ikke oprette produkt med varenr. '${p.sku}'`,
                )
              }),
          )
        }
      }

      const [newProductsResponses, existingProductsResponses] =
        await Promise.all([
          Promise.all(newProductsPromises),
          Promise.all(existingProductsPromises),
        ])

      const newProducts = newProductsResponses.filter(p => p != undefined)
      const updatedProducts = existingProductsResponses.filter(
        p => p != undefined,
      )

      const productHistoryPromises = [
        ...updatedProducts.map(p => {
          const unit = units.find(u => (u.id = p.unitID))!
          const group = groups.find(g => (g.id = p.groupID))!
          return product.createHistoryLog(
            {
              userID: importingUser.id,
              userName: importingUser.name,
              userRole: importingUser.role,
              customerID,
              productID: p.id,
              productUnitName: unit.name,
              productGroupName: group.name,
              productText1: p.text1,
              productSku: p.sku,
              productBarcode: p.barcode,
              productCostPrice: p.costPrice,
              productIsBarred: p.isBarred,
              productText2: p.text2,
              productText3: p.text3,
              productSalesPrice: p.salesPrice,
              productNote: p.note,
              type: 'opdatering',
              isImport: true,
            },
            trx,
          )
        }),
        ...newProducts.map(p => {
          const unit = units.find(u => (u.id = p.unitID))!
          const group = groups.find(g => (g.id = p.groupID))!
          return product.createHistoryLog(
            {
              userID: importingUser.id,
              userName: importingUser.name,
              userRole: importingUser.role,
              customerID,
              productID: p.id,
              productUnitName: unit.name,
              productGroupName: group.name,
              productText1: p.text1,
              productSku: p.sku,
              productBarcode: p.barcode,
              productCostPrice: p.costPrice,
              productIsBarred: p.isBarred,
              productText2: p.text2,
              productText3: p.text3,
              productSalesPrice: p.salesPrice,
              productNote: p.note,
              type: 'oprettelse',
              isImport: true,
            },
            trx,
          )
        }),
      ]
      const zeroInventoryPromises = []

      if (newProducts.length > 0) {
        for (const loc of locations) {
          const placementID = defaultPlacementMap.get(loc.id)!
          const batchID = defaultBatchMap.get(loc.id)!

          const inventories: NewInventory[] = newProducts.map(prod => ({
            customerID,
            productID: prod.id,
            locationID: loc.id,
            placementID,
            batchID,
          }))
          zeroInventoryPromises.push(inventory.createMany(inventories, trx))
        }
      }

      await Promise.all([zeroInventoryPromises, productHistoryPromises])

      return true
    })
    console.log(`${performance.now() - start} ms execution time`)
    return transaction
  },
  createHistoryLog: async function (
    newProductLog: NewProductHistory,
  ): Promise<ProductHistory | undefined> {
    return await product.createHistoryLog(newProductLog)
  },
  getHistoryLogs: async function (
    customerID: CustomerID,
    productID?: ProductID,
  ): Promise<ProductHistory[]> {
    if (productID != undefined) {
      return product.getHistoryLogs(customerID, productID)
    } else {
      return product.getHistoryLogsForCustomer(customerID)
    }
  },
}

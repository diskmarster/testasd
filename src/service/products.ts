import { inventory } from '@/data/inventory'
import { location } from '@/data/location'
import { product } from '@/data/products'
import {
  FormattedProduct,
  ProductFilters,
  ProductWithInventories,
} from '@/data/products.types'
import { db, TRX } from '@/lib/database'
import { CustomerID, LocationID } from '@/lib/database/schema/customer'
import {
  Batch,
  DefaultPlacement,
  Group,
  Inventory,
  NewHistory,
  NewInventory,
  NewProduct,
  NewProductHistory,
  PartialProduct,
  Placement,
  PlacementID,
  Product,
  ProductHistory,
  ProductID,
} from '@/lib/database/schema/inventory'

import { ImportProducts } from '@/app/[lng]/(site)/varer/produkter/validation'
import { serverTranslation } from '@/app/i18n'
import { fallbackLng } from '@/app/i18n/settings'
import { suppliers } from '@/data/suppliers'
import { user as userData } from '@/data/user'
import { UserID } from '@/lib/database/schema/auth'
import {
  ACTION_ERR_INTERNAL,
  ACTION_ERR_UNAUTHORIZED,
  ActionError,
} from '@/lib/safe-action/error'
import { tryCatch } from '@/lib/utils.server'
import { LibsqlError } from '@libsql/client'
import { inventoryService } from './inventory'
import { User } from 'lucia'
import { locationService } from './location'
import { HistoryPlatform } from '@/data/inventory.types'

export const productService = {
  create: async function(
    productData: NewProduct,
    customerID: CustomerID,
    userID: UserID,
    lang: string = fallbackLng,
    defaultPlacementMap?: Map<LocationID, PlacementID>,
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
          const placementIDs: PlacementID[] = []
          const defaultPlacementID = defaultPlacementMap?.get(location.id)
          if (defaultPlacementID) {
            await inventory.upsertDefaultPlacement(
              [newProduct.id, defaultPlacementID, location.id],
              trx,
            )
            placementIDs.push(defaultPlacementID)
          }

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

          placementIDs.push(placementID)

          if (!defaultBatch) {
            const newBatch = await inventory.createBatch(
              { batch: '-', locationID: location.id },
              trx,
            )
            batchID = newBatch.id
          }

          await Promise.all(
            placementIDs.map(async placementID => {
              const newInventoryData: NewInventory = {
                productID: newProduct.id,
                placementID: placementID,
                batchID: batchID,
                quantity: 0,
                customerID: customerID,
                locationID: location.id,
              }
              await inventory.upsertInventory(newInventoryData, trx)
            }),
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
  getAllProductsWithInventories: async function(
    customerID: CustomerID,
    filters?: ProductFilters,
  ): Promise<ProductWithInventories[]> {
    try {
      const productsWithInventory = await product.getWithInventoryByCustomerID(
        customerID,
        filters,
      )

      const invMap: Map<
        ProductID,
        [
          FormattedProduct,
          (Inventory & {
            locationName: string
            placementName: string
            batchName: string
            isDefaultPlacement: boolean
          })[],
          Pick<DefaultPlacement, 'placementID' | 'productID' | 'locationID'>[],
        ]
      > = productsWithInventory.reduce<
        Map<
          ProductID,
          [
            FormattedProduct,
            (Inventory & {
              locationName: string
              placementName: string
              batchName: string
              isDefaultPlacement: boolean
            })[],
            Pick<
              DefaultPlacement,
              'placementID' | 'productID' | 'locationID'
            >[],
          ]
        >
      >((acc, cur) => {
        if (acc.has(cur.id)) {
          const [product, inventories, defaultPlacements] = acc.get(cur.id)!
          inventories.push(cur.inventory)
          if (
            cur.inventory.isDefaultPlacement &&
            defaultPlacements.every(
              dp =>
                dp.placementID != cur.inventory.placementID ||
                dp.locationID != cur.inventory.locationID,
            )
          ) {
            const inv = cur.inventory
            defaultPlacements.push({
              placementID: inv.placementID,
              locationID: inv.locationID,
              productID: inv.productID,
            })
          }
          acc.set(cur.id, [product, inventories, defaultPlacements])
        } else {
          const inv = cur.inventory
          acc.set(cur.id, [
            {
              id: cur.id,
              inserted: cur.inserted,
              updated: cur.updated,
              customerID: cur.customerID,
              isBarred: cur.isBarred,
              groupID: cur.groupID,
              unitID: cur.unitID,
              text1: cur.text1,
              text2: cur.text2,
              text3: cur.text3,
              sku: cur.sku,
              barcode: cur.barcode,
              costPrice: cur.costPrice,
              salesPrice: cur.salesPrice,
              note: cur.note,
              supplierID: cur.supplierID,
              group: cur.group,
              unit: cur.unit,
              supplierName: cur.supplierName,
              useBatch: cur.useBatch,
            },
            [inv],
            inv.isDefaultPlacement
              ? [
                {
                  placementID: inv.placementID,
                  locationID: inv.locationID,
                  productID: inv.productID,
                },
              ]
              : [],
          ])
        }

        return acc
      }, new Map())

      const uniqueProducts = Array.from(invMap.values()).map(
        ([product, inventories, defaultPlacements]) => ({
          ...product,
          inventories,
          defaultPlacements,
        }),
      )

      return uniqueProducts
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
    return await product.getAllByCustomerID(customerID, true, trx)
  },
  getAllActiveByCustomerID: async function(
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<FormattedProduct[]> {
    return await product.getAllByCustomerID(customerID, false, trx)
  },
  updateByID: async function(
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

        const historyLog: NewProductHistory = {
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
          supplierID: null,
          supplierName: '',
        }

        if (updatedProductData.supplierID) {
          const supplier = await suppliers.getByID(
            updatedProductData.supplierID!,
            user?.customerID!,
          )
          historyLog.supplierID = supplier.id
          historyLog.supplierName = supplier.name
        }

        await product.createHistoryLog(historyLog, trx)

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
  updateBarredStatus: async function(
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
  getByID: async function(
    id: ProductID,
    lang: string = fallbackLng,
  ): Promise<
    | (FormattedProduct & {
      inventories: Inventory[]
      defaultPlacements: DefaultPlacement[]
    })
    | undefined
  > {
    const { t } = await serverTranslation(lang, 'action-errors')
    try {
      const p = await product.getByID(id)
      if (p == undefined) {
        return undefined
      }

      const inventories = await inventoryService.getInventoryByProductID(id)
      const defaultPlacements =
        await inventoryService.getDefaultPlacementForProduct(id)

      return {
        ...p,
        inventories,
        defaultPlacements,
      }
    } catch (e) {
      console.error(`ERROR: Trying to get product by id failed: ${e}`)
      throw new ActionError(
        `${t('product-service-action.product-id-not-found')} ${id}`,
      )
    }
  },
  importProducts: async function(
    customerID: CustomerID,
    userID: UserID,
    importedProducts: ImportProducts,
  ): Promise<{ updated: number; created: number }> {
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
                unitID:
                  units.find(u => u.name.toLowerCase() == p.unit.toLowerCase())
                    ?.id ?? units[0].id,
                text1: p.text1,
                sku: p.sku,
                barcode: p.barcode,
                costPrice: p.costPrice,
                isBarred: p.isBarred,
                text2: p.text2,
                text3: p.text3,
                salesPrice: p.salesPrice,
                note: p.note,
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
                  unitID:
                    units.find(
                      u => u.name.toLowerCase() == p.unit.toLowerCase(),
                    )?.id ?? units[0].id,
                  text1: p.text1,
                  sku: p.sku,
                  barcode: p.barcode,
                  costPrice: p.costPrice,
                  isBarred: p.isBarred,
                  text2: p.text2,
                  text3: p.text3,
                  salesPrice: p.salesPrice,
                  note: p.note,
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

      const productReorders: Map<
        String,
        {
          minimum: number
          maximum: number
          orderAmount: number
        }
      > = importedProducts
        .filter(p => p.minimum != undefined)
        .reduce((acc, cur) => {
          acc.set(cur.sku, {
            minimum: cur.minimum!,
            maximum: cur.maximum,
            orderAmount: cur.orderAmount!, // If minimum is specified the import validation errors if no orderAmount is present
          })
          return acc
        }, new Map())

      const reorderPromises: Promise<any>[] = []
      for (const p of [...newProducts, ...updatedProducts]) {
        const reorder = productReorders.get(p.sku)

        if (reorder != undefined) {
          reorderPromises.push(
            Promise.all(
              locations.map(loc =>
                inventory.upsertReorder(
                  {
                    locationID: loc.id,
                    customerID: customerID,
                    productID: p.id,
                    minimum: reorder.minimum,
                    maxOrderAmount: reorder.maximum,
                    orderAmount: reorder.orderAmount,
                  },
                  trx,
                ),
              ),
            ),
          )
        }
      }

      await Promise.all(reorderPromises)

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

      return { updated: updatedProducts.length, created: newProducts.length }
    })
    console.log(`${performance.now() - start} ms execution time`)
    return transaction
  },
  createHistoryLog: async function(
    newProductLog: NewProductHistory,
  ): Promise<ProductHistory | undefined> {
    return await product.createHistoryLog(newProductLog)
  },
  getHistoryLogs: async function(
    customerID: CustomerID,
    productID?: ProductID,
  ): Promise<ProductHistory[]> {
    if (productID != undefined) {
      return product.getHistoryLogs(customerID, productID)
    } else {
      return product.getHistoryLogsForCustomer(customerID)
    }
  },
  importInventoryQuantities: async function(data: {
    customerID: CustomerID
    locationID: LocationID
    items: { sku: string; placement: string; quantity: number }[]
  }): Promise<string[]> {
    const transaction = await db.transaction(async trx => {
      const [products, placements, batches] = await Promise.all([
        inventory.getAllProductsByID(data.customerID, trx),
        inventory.getAllPlacementsByID(data.locationID, trx),
        inventory.getAllBatchesByID(data.locationID, trx),
      ])

      const productsMap = new Map<string, Product>(
        products.map(p => [p.sku.toUpperCase(), p]),
      )
      const placementMap = new Map<string, Placement>(
        placements.map(p => [p.name.trim(), p]),
      )
      const batchMap = new Map<string, Batch>(
        batches.map(b => [b.batch.trim(), b]),
      )

      const defaultBatch = batchMap.get('-')
      const defaultPlacement = placementMap.get('-')

      const insertPromisis = []
      const skippedSkus = new Set<string>()

      for (const item of data.items) {
        const product = productsMap.get(item.sku)

        if (!product) {
          skippedSkus.add(item.sku)
          continue
        }

        let placement: Placement | undefined
        if (item.placement == '' || item.placement == '-') {
          placement = defaultPlacement
        }

        placement ??= placementMap.get(item.placement.trim())

        if (!placement) {
          const newPlacement = await inventory.createPlacement(
            {
              name: item.placement.trim(),
              locationID: data.locationID,
            },
            trx,
          )

          placementMap.set(newPlacement.name, newPlacement)
          placement = newPlacement
        }

        const newInventory: NewInventory = {
          customerID: data.customerID,
          locationID: data.locationID,
          batchID: defaultBatch?.id!,
          placementID: placement.id,
          productID: product.id,
          quantity: item.quantity,
        }

        insertPromisis.push(inventory.upsertInventory(newInventory, trx))
      }

      await Promise.all(insertPromisis)

      return Array.from(skippedSkus)
    })

    return transaction
  },
  importInventoryHistory: async function(
    data: {
      customerID: CustomerID
      locationID: LocationID
      items: {
        inserted: Date
        text1: string
        text2: string
        text3: string
        sku: string
        barcode: string
        costPrice: number
        salesPrice: number
        type: string
        quantity: number
        placement: string
        batch: string
        user: string
        reference: string
        platform: string
        group: string
        unit: string
      }[]
    },
    refSuffix?: string,
  ): Promise<void> {
    await db.transaction(async trx => {
      const historyPromises = []
      for (const item of data.items) {
        const entry: NewHistory = {
          customerID: data.customerID,
          locationID: data.locationID,
          platform: item.platform as 'web' | 'app',
          amount: item.quantity,
          productText1: item.text1,
          productText2: item.text2,
          productText3: item.text3,
          productSku: item.sku,
          productBarcode: item.barcode,
          productSalesPrice: item.salesPrice,
          productCostPrice: item.costPrice,
          type: item.type as 'tilgang' | 'afgang' | 'regulering' | 'flyt',
          userName: item.user,
          inserted: item.inserted,
          placementName: item.placement,
          batchName: item.batch,
          productGroupName: item.group,
          productUnitName: item.unit,
          reference: refSuffix
            ? `${item.reference} ${refSuffix}`
            : item.reference,
        }

        historyPromises.push(inventory.createHistoryLog(entry, trx))
      }

      await Promise.all(historyPromises)
    })
  },
  softDeleteProduct: async function(
    productID: ProductID,
    customerID: CustomerID,
		user: User | null,
		userName: string | null,
		lng: string,
		historyPlatform: HistoryPlatform,
  ): Promise<boolean> {
		if (user == null && userName == null) {
			console.error(`Both user and userName is missing`)
			return false
		}

		const { t } = await serverTranslation(lng, 'action-errors')

		const locations = await locationService.getByCustomerID(customerID)

    return await db.transaction(async tx => {
      const p = await tryCatch(product.getByID(productID, tx))
      if (!p.success || p.data === undefined) {
        console.error(
          p.error ?? `No product found for product id: ${productID}`,
        )
        return false
      }
      if (p.data.customerID != customerID) {
        console.error(
          'Provided customer id did not match customer id of product',
        )
        return false
      }

      const deletedProductRes = await tryCatch(
        product.deleteProduct(productID, tx),
      )
      if (!deletedProductRes.success) {
        console.error(deletedProductRes.error)

        tx.rollback()
        return false
      }

      const insertDeletedRes = await tryCatch(
        product.insertDeletedProduct(p.data, tx),
      )
      if (!insertDeletedRes.success) {
        console.error(insertDeletedRes.error)

        tx.rollback()
        return false
      }

			const historyLogProductInfo = {
				productID: p.data.id,
				productSku: p.data.sku,
				productText1: p.data.text1,
				productText2: p.data.text2,
				productText3: p.data.text3,
				productBarcode: p.data.barcode,
				productUnitName: p.data.unit,
				productGroupName: p.data.group,
				productCostPrice: p.data.costPrice,
				productSalesPrice: p.data.salesPrice,
			}

			let userInfo: {
				userName: string,
				userID?: number,
				userRole?: string,
			};
			if (user != null) {
				userInfo = {
					userID: user.id,
					userName: user.name,
					userRole: user.role,
				}
			} else if (userName != null) {
				userInfo = {
					userName,
				}
			}

			const historyLogData: NewHistory[] = locations.map(loc => ({
				...historyLogProductInfo,
				customerID: customerID,
				locationID: loc.id,
				...userInfo,
				type: 'slet',
				platform: historyPlatform,
				amount: 0,
				reference: t('product-service-action.product-delete-history-ref'),
			}))

			const historyLogRes = await tryCatch(
				Promise.all(
					historyLogData.map(async (data) => (
						inventory.createHistoryLog(
							data,
							tx
						)
					))
				)
			)
      if (!historyLogRes.success) {
        console.error(historyLogRes.error)

        tx.rollback()
        return false
      }

      return true
    })
  },
  getBySkuOrBarcode: async function(
    customerID: CustomerID,
    skuOrBarcode: string,
    lang: string = fallbackLng,
  ): Promise<(FormattedProduct & { inventories: Inventory[] }) | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')
    try {
      const p = await product.getBySkuOrBarcode(customerID, skuOrBarcode)
      if (p == undefined) {
        return undefined
      }

      const inventories = await inventoryService.getInventoryByProductID(p.id)

      return {
        ...p,
        inventories,
      }
    } catch (e) {
      console.error(`ERROR: Trying to get product by id failed: ${e}`)
      throw new ActionError(
        `${t('product-service-action.product-sku-barcode-not-found')} ${skuOrBarcode}`,
      )
    }
  },
  getBatchProducts: async function(
    customerID: CustomerID,
  ): Promise<FormattedProduct[]> {
    return product.getBatchProducts(customerID)
  },
}

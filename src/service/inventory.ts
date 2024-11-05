import { serverTranslation } from '@/app/i18n'
import { fallbackLng } from '@/app/i18n/settings'
import { inventory } from '@/data/inventory'
import {
  FormattedInventory,
  FormattedReorder,
  HistoryType,
} from '@/data/inventory.types'
import { db, TRX } from '@/lib/database'
import { UserID } from '@/lib/database/schema/auth'
import { CustomerID, LocationID } from '@/lib/database/schema/customer'
import {
  Batch,
  BatchID,
  Group,
  GroupID,
  History,
  Inventory,
  NewBatch,
  NewHistory,
  NewPlacement,
  NewReorder,
  NewUnit,
  PartialGroup,
  PartialPlacement,
  PartialReorder,
  PartialUnit,
  Placement,
  PlacementID,
  Product,
  ProductID,
  Reorder,
  Unit,
  UnitID,
} from '@/lib/database/schema/inventory'
import { ActionError } from '@/lib/safe-action/error'
import { LibsqlError } from '@libsql/client'
import { productService } from './products'
import { userService } from './user'

export const inventoryService = {
  getInventory: async function (
    locationID: LocationID,
  ): Promise<FormattedInventory[]> {
    const rows: FormattedInventory[] = []
    let page = 1
    const pageSize = 5000
    let receivedPageSize = 0

    do {
      const temp = await inventory.getInventoryByLocationID(
        locationID,
        pageSize,
        page,
      )

      rows.push(...temp)

      receivedPageSize = temp.length
      page += 1
    } while (receivedPageSize == pageSize)

    return rows
  },
  getActiveUnits: async function (): Promise<Unit[]> {
    return inventory.getActiveUnits()
  },
  getActiveGroupsByID: async function (
    customerID: CustomerID,
  ): Promise<Group[]> {
    return await inventory.getActiveGroupsByID(customerID)
  },
  getAllGroupsByID: async function (customerID: CustomerID): Promise<Group[]> {
    return await inventory.getAllGroupsByID(customerID)
  },
  getActivePlacementsByID: async function (
    locationID: LocationID,
  ): Promise<Placement[]> {
    return await inventory.getActivePlacementsByID(locationID)
  },
  getAllPlacementsByID: async function (
    locationID: LocationID,
  ): Promise<Placement[]> {
    return await inventory.getAllPlacementsByID(locationID)
  },
  getActiveBatchesByID: async function (
    locationID: LocationID,
  ): Promise<Batch[]> {
    return await inventory.getActiveBatchesByID(locationID)
  },
  getInventoryByIDs: async function (
    productID: ProductID,
    placementID: PlacementID,
    batchID: BatchID,
  ): Promise<Inventory | undefined> {
    return await inventory.getInventoryByIDs(productID, placementID, batchID)
  },
  createHistoryLog: async function (
    historyData: {
      customerID: CustomerID
      locationID: LocationID
      productID: ProductID
      placementID: PlacementID
      batchID: BatchID
      userID: UserID
      type: 'tilgang' | 'afgang' | 'regulering' | 'flyt'
      platform: 'web' | 'app'
      amount: number
      reference: string | undefined
    },
    trx?: TRX,
  ): Promise<History | undefined> {
    const historyLogData: NewHistory = {
      ...historyData,
    }

    // fetch product info
    const productPromise = productService
      .getByID(historyData.productID)
      .then(product => {
        historyLogData.productSku = product?.sku
        historyLogData.productText1 = product?.text1
        historyLogData.productText2 = product?.text2
        historyLogData.productText3 = product?.text3
        historyLogData.productBarcode = product?.barcode
        historyLogData.productUnitName = product?.unit
        historyLogData.productGroupName = product?.group
        historyLogData.productCostPrice = product?.costPrice
        historyLogData.productSalesPrice = product?.salesPrice
      })
    // fetch user info
    const userPromise = userService.getByID(historyData.userID).then(user => {
      historyLogData.userName = user?.name
      historyLogData.userRole = user?.role
    })
    // fetch placement info
    const placementPromise = this.getPlacementByID(
      historyData.placementID,
    ).then(placement => {
      historyLogData.placementName = placement?.name
    })
    // fetch batch info
    const batchPromise = this.getBatchByID(historyData.batchID).then(batch => {
      historyLogData.batchName = batch?.batch
    })

    await Promise.all([
      productPromise,
      userPromise,
      placementPromise,
      batchPromise,
    ])

    return await inventory.createHistoryLog(historyLogData, trx)
  },
  upsertInventory: async function (
    platform: 'web' | 'app',
    customerID: CustomerID,
    userID: UserID,
    locationID: LocationID,
    productID: ProductID,
    placementID: PlacementID,
    batchID: BatchID,
    type: HistoryType,
    amount: number,
    reference: string = '',
    lang: string = fallbackLng,
  ): Promise<boolean> {
    const { t } = await serverTranslation(lang, 'action-errors')
    const result = await db.transaction(async trx => {
      const isReorderOnProduct = await inventory.getReorderByProductID(
        productID,
        locationID,
        customerID,
        trx,
      )

      if (
        isReorderOnProduct &&
        isReorderOnProduct.ordered > 0 &&
        type == 'tilgang'
      ) {
        const updatedOrdered = Math.max(isReorderOnProduct.ordered - amount, 0)
        const isReorderUpdated = await inventory.updateReorderByID(
          productID,
          locationID,
          customerID,
          {
            ordered: updatedOrdered,
          },
          trx,
        )
        if (!isReorderUpdated) {
          throw new ActionError(
            t('inventory-service-action.restock-not-updated'),
          )
        }
      }

      const didUpsert = await inventory.upsertInventory(
        {
          customerID,
          locationID,
          productID,
          placementID,
          batchID,
          quantity: amount,
        },
        trx,
      )
      if (!didUpsert) {
        throw new ActionError(
          t('inventory-service-action.inventory-not-updated'),
        )
      }

      const historyLog = await this.createHistoryLog(
        {
          customerID,
          locationID,
          productID,
          placementID,
          batchID,
          userID,
          type,
          platform,
          amount,
          reference,
        },
        trx,
      )
      if (!historyLog) {
        throw new ActionError(
          t('inventory-service-action.inventory-not-updated'),
        )
      }

      return didUpsert && !!historyLog
    })

    return result
  },
  moveInventory: async function (
    platform: 'web' | 'app',
    customerID: CustomerID,
    userID: UserID,
    locationID: LocationID,
    productID: ProductID,
    fromPlacementID: PlacementID,
    fromBatchID: BatchID,
    toPlacementID: PlacementID,
    type: HistoryType,
    amount: number,
    reference: string = '',
    lang: string = fallbackLng,
  ): Promise<boolean> {
    const { t } = await serverTranslation(lang, 'action-errors')
    const result = await db.transaction(async trx => {
      const didUpdateFrom = await inventory.updateInventory(
        productID,
        fromPlacementID,
        fromBatchID,
        -amount,
        trx,
      )
      if (!didUpdateFrom) {
        throw new ActionError(
          t('inventory-service-action.couldnt-move-inventory'),
        )
      }

      const didUpsertTo = await inventory.upsertInventory(
        {
          customerID,
          locationID,
          productID,
          placementID: toPlacementID,
          batchID: fromBatchID,
          quantity: amount,
        },
        trx,
      )

      if (!didUpsertTo) {
        throw new ActionError(
          t('inventory-service-action.couldnt-move-inventory-to-placement'),
        )
      }

      const fromHistoryLog = await this.createHistoryLog(
        {
          customerID,
          locationID,
          productID,
          placementID: fromPlacementID,
          batchID: fromBatchID,
          userID,
          type,
          platform,
          amount: -amount,
          reference: reference,
        },
        trx,
      )

      const toHistoryLog = await this.createHistoryLog(
        {
          customerID,
          locationID,
          productID,
          placementID: toPlacementID,
          batchID: fromBatchID,
          userID,
          type,
          platform,
          amount,
          reference: reference,
        },
        trx,
      )

      if (!fromHistoryLog || !toHistoryLog) {
        throw new ActionError(
          t('inventory-service-action.couldnt-update-history'),
        )
      }

      return didUpdateFrom && didUpsertTo && !!fromHistoryLog && !!toHistoryLog
    })

    return result
  },
  getActiveProductsByID: async function (
    customerID: CustomerID,
  ): Promise<Product[]> {
    return await inventory.getActiveProductsByID(customerID)
  },
  createPlacement: async function (
    placementData: NewPlacement,
    lang: string = fallbackLng,
  ): Promise<Placement | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')
    try {
      return await inventory.createPlacement(placementData)
    } catch (err) {
      if (err instanceof LibsqlError) {
        if (err.message.includes('location_id')) {
          throw new ActionError(
            t('inventory-service-action.placement-already-exists'),
          )
        }
      }
    }
  },
  createProductGroup: async function (
    groupData: {
      name: string
      customerID: number
    },
    lang: string = fallbackLng,
  ): Promise<Group | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')
    try {
      return await inventory.createProductGroup(groupData)
    } catch (err) {
      if (err instanceof LibsqlError) {
        if (err.message.includes('name')) {
          throw new ActionError(
            t('inventory-service-action.product-group-name-already-exists'),
          )
        }
      }
    }
  },

  createBatch: async function (
    batchData: NewBatch,
    lang: string = fallbackLng,
  ): Promise<Batch | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')
    try {
      return await inventory.createBatch(batchData)
    } catch (err) {
      if (err instanceof LibsqlError) {
        if (err.message.includes('location_id')) {
          throw new ActionError(
            t('inventory-service-action.batch-already-exists'),
          )
        }
      }
    }
  },
  getHistoryByLocationID: async function (
    locationID: LocationID,
  ): Promise<History[]> {
    return await inventory.getHistoryByLocationID(locationID)
  },
  createReorder: async function (
    reorderData: NewReorder,
  ): Promise<Reorder | undefined> {
    return await inventory.createReorder({
      ...reorderData,
      buffer: reorderData.buffer / 100,
    })
  },
  deleteReorderByIDs: async function (
    productID: ProductID,
    locationID: LocationID,
    customerID: CustomerID,
  ): Promise<boolean> {
    return await inventory.deleteReorderByID(productID, locationID, customerID)
  },
  updateReorderByIDs: async function (
    productID: ProductID,
    locationID: LocationID,
    customerID: CustomerID,
    reorderData: PartialReorder,
  ): Promise<boolean> {
    return await inventory.updateReorderByID(
      productID,
      locationID,
      customerID,
      reorderData,
    )
  },
  getReordersByID: async function (
    locationID: LocationID,
  ): Promise<FormattedReorder[]> {
    const reorders = await inventory.getAllReordersByID(locationID)

    const reordersWithRecommended = reorders.map(reorder => {
      const isQuantityGreater = reorder.quantity > reorder.minimum
      const recommended = isQuantityGreater
        ? 0
        : Math.max(
            reorder.minimum -
              reorder.quantity +
              reorder.minimum * reorder.buffer,
            0,
          )
      const disposible = reorder.quantity + reorder.ordered

      return {
        ...reorder,
        recommended,
        disposible,
      }
    })

    return reordersWithRecommended
  },
  getInventoryByProductID: async function (
    productID: ProductID,
  ): Promise<Inventory[]> {
    return await inventory.getInventoryByProductID(productID)
  },

  createUnit: async function (
    unitData: NewUnit,
    lang: string = fallbackLng,
  ): Promise<Unit | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')
    try {
      return await inventory.createUnit(unitData)
    } catch (err) {
      if (err instanceof LibsqlError) {
        if (err.message.includes('name')) {
          throw new ActionError(
            t('inventory-service-action.unit-name-already-exists'),
          )
        }
      }
    }
  },
  updateUnitByID: async function (
    unitID: UnitID,
    updatedUnitData: PartialUnit,
  ): Promise<Unit | undefined> {
    const updatedUnit = await inventory.updateUnitByID(unitID, updatedUnitData)
    if (!updatedUnit) return undefined
    return updatedUnit
  },

  updateUnitBarredStatus: async function (
    unitID: UnitID,
    isBarred: boolean,
  ): Promise<Unit | undefined> {
    try {
      const updatedUnit = await inventory.updateUnitByID(unitID, { isBarred })
      if (!updatedUnit) return undefined
      return updatedUnit
    } catch (err) {
      console.error('Der skete en fejl med spærringen:', err)
    }
  },
  getAllUnits: async function (): Promise<Unit[]> {
    return await inventory.getAllUnits()
  },

  updateGroupByID: async function (
    groupID: GroupID,
    updatedGroupData: PartialGroup,
  ): Promise<Group | undefined> {
    const updatedGroup = await inventory.updateGroupByID(
      groupID,
      updatedGroupData,
    )

    if (!updatedGroup) return undefined
    return updatedGroup
  },

  updatePlacementByID: async function (
    placementID: PlacementID,
    updatedPlacementData: PartialPlacement,
  ): Promise<Placement | undefined> {
    const updatedPlacement = await inventory.updatePlacementByID(
      placementID,
      updatedPlacementData,
    )
    if (!updatedPlacement) return undefined
    return updatedPlacement
  },

  updateGroupBarredStatus: async function (
    groupID: GroupID,
    isBarred: boolean,
  ): Promise<Group | undefined> {
    try {
      const updatedGroup = await inventory.updateGroupByID(groupID, {
        isBarred,
      })
      if (!updatedGroup) return undefined
      return updatedGroup
    } catch (err) {
      console.error('Der skete en fejl med spærringen:', err)
    }
  },
  updatePlacementBarredStatus: async function (
    placementID: PlacementID,
    isBarred: boolean,
  ): Promise<Placement | undefined> {
    try {
      const updatedPlacement = await inventory.updatePlacementByID(
        placementID,
        { isBarred },
      )
      if (!updatedPlacement) return undefined
      return updatedPlacement
    } catch (err) {
      console.error('Der skete en fejl med spærringen:', err)
    }
  },
  createInventory: async function (
    customerID: number,
    productID: number,
    locationID: string,
    placementID: number,
    batchID: number,
  ): Promise<Inventory | undefined> {
    return await inventory.createInventory({
      customerID,
      productID,
      locationID,
      placementID,
      batchID,
      quantity: 0,
    })
  },
  getPlacementByID: async function (
    placementID: PlacementID,
  ): Promise<Placement | undefined> {
    return await inventory.getPlacementByID(placementID)
  },
  getBatchByID: async function (batchID: BatchID): Promise<Batch | undefined> {
    return await inventory.getBatchByID(batchID)
  },
}

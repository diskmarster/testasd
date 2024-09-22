import { inventory } from '@/data/inventory'
import {
  FormattedHistory,
  FormattedInventory,
  FormattedReorder,
  HistoryType,
} from '@/data/inventory.types'
import { db } from '@/lib/database'
import { UserID } from '@/lib/database/schema/auth'
import { CustomerID, LocationID } from '@/lib/database/schema/customer'
import {
  Batch,
  BatchID,
  Group,
  History,
  Inventory,
  NewBatch,
  NewHistory,
  NewPlacement,
  NewReorder,
  Placement,
  PlacementID,
  Product,
  ProductID,
  Reorder,
  Unit,
} from '@/lib/database/schema/inventory'
import { ActionError } from '@/lib/safe-action/error'
import { LibsqlError } from '@libsql/client'

export const inventoryService = {
  getInventory: async function(
    locationID: LocationID,
  ): Promise<FormattedInventory[]> {
    return await inventory.getInventoryByLocationID(locationID)
  },
  getUnits: async function(): Promise<Unit[]> {
    return inventory.getUnits()
  },
  getGroupsByID: async function(customerID: CustomerID): Promise<Group[]> {
    return await inventory.getGroupsByID(customerID)
  },
  getPlacementsByID: async function(
    locationID: LocationID,
  ): Promise<Placement[]> {
    return await inventory.getPlacementsByID(locationID)
  },
  getBatchesByID: async function(locationID: LocationID): Promise<Batch[]> {
    return await inventory.getBatchesByID(locationID)
  },
  getInventoryByIDs: async function(
    productID: ProductID,
    placementID: PlacementID,
    batchID: BatchID,
  ): Promise<Inventory | undefined> {
    return await inventory.getInventoryByIDs(productID, placementID, batchID)
  },
  createHistoryLog: async function(
    historyData: NewHistory,
  ): Promise<History | undefined> {
    return await inventory.createHitoryLog(historyData)
  },
  upsertInventory: async function(
    platform: 'web' | 'app',
    customerID: CustomerID,
    userID: UserID,
    locationID: LocationID,
    productID: ProductID,
    placementID: PlacementID,
    batchID: BatchID,
    type: HistoryType,
    amount: number,
  ): Promise<boolean> {
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
          throw new ActionError('Genbestil på produktet kunne ikke opdateret')
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
        throw new ActionError('Beholdning blev ikke opdateret')
      }

      const historyLog = await inventory.createHitoryLog(
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
        },
        trx,
      )
      if (!historyLog) {
        throw new ActionError('Beholdning blev ikke opdateret')
      }

      return didUpsert && !!historyLog
    })

    return result
  },
  moveInventory: async function(
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
  ): Promise<boolean> {
    const result = await db.transaction(async trx => {
      const didUpdateFrom = await inventory.updateInventory(
        productID,
        fromPlacementID,
        fromBatchID,
        -amount,
        trx,
      )
      if (!didUpdateFrom) {
        throw new ActionError('Beholdning blev opdatere beholdning')
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
        throw new ActionError('Kunne ikke flytte beholdning til placering')
      }

      const fromHistoryLog = await inventory.createHitoryLog(
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
        },
        trx,
      )

      const toHistoryLog = await inventory.createHitoryLog(
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
        },
        trx,
      )

      if (!fromHistoryLog || !toHistoryLog) {
        throw new ActionError('Kunne ikke opdatere historikken')
      }

      return didUpdateFrom && didUpsertTo && !!fromHistoryLog && !!toHistoryLog
    })

    return result
  },
  getProductsByID: async function(customerID: CustomerID): Promise<Product[]> {
    return await inventory.getProductsByID(customerID)
  },
  createPlacement: async function(
    placementData: NewPlacement,
  ): Promise<Placement | undefined> {
    try {
      return await inventory.createPlacement(placementData)
    } catch (err) {
      if (err instanceof LibsqlError) {
        if (err.message.includes('location_id')) {
          throw new ActionError('Placering findes allerede')
        }
      }
    }
  },
  createBatch: async function(
    batchData: NewBatch,
  ): Promise<Batch | undefined> {
    try {
      return await inventory.createBatch(batchData)
    } catch (err) {
      if (err instanceof LibsqlError) {
        if (err.message.includes('location_id')) {
          throw new ActionError('Batchnr. findes allerede')
        }
      }
    }
  },
  getHistoryByLocationID: async function(
    locationID: LocationID,
  ): Promise<FormattedHistory[]> {
    return await inventory.getHistoryByLocationID(locationID)
  },
  createReorder: async function(
    reorderData: NewReorder,
  ): Promise<Reorder | undefined> {
    return await inventory.createReorder({
      ...reorderData,
      buffer: reorderData.buffer / 100,
    })
  },
  deleteReorderByIDs: async function(
    productID: ProductID,
    locationID: LocationID,
    customerID: CustomerID,
  ): Promise<boolean> {
    return await inventory.deleteReorderByID(productID, locationID, customerID)
  },
  updateReorderByIDs: async function(
    productID: ProductID,
    locationID: LocationID,
    customerID: CustomerID,
    reorderData: Pick<Reorder, 'minimum' | 'buffer'>,
  ): Promise<boolean> {
    return await inventory.updateReorderByID(
      productID,
      locationID,
      customerID,
      {
        ...reorderData,
        buffer: reorderData.buffer / 100,
      },
    )
  },
  getReordersByID: async function(
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

      return {
        ...reorder,
        recommended,
      }
    })

    return reordersWithRecommended
  },
}

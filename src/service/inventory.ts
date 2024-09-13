import { inventory } from '@/data/inventory'
import {
  FormattedHistory,
  FormattedInventory,
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
  Placement,
  PlacementID,
  Product,
  ProductID,
  Unit,
} from '@/lib/database/schema/inventory'
import { ActionError } from '@/lib/safe-action/error'
import { LibsqlError } from '@libsql/client'

export const inventoryService = {
  getInventory: async function (
    locationID: LocationID,
  ): Promise<FormattedInventory[]> {
    return await inventory.getInventoryByLocationID(locationID)
  },
  getUnits: async function (): Promise<Unit[]> {
    return inventory.getUnits()
  },
  getGroupsByID: async function (customerID: CustomerID): Promise<Group[]> {
    return await inventory.getGroupsByID(customerID)
  },
  getPlacementsByID: async function (
    locationID: LocationID,
  ): Promise<Placement[]> {
    return await inventory.getPlacementsByID(locationID)
  },
  getBatchesByID: async function (locationID: LocationID): Promise<Batch[]> {
    return await inventory.getBatchesByID(locationID)
  },
  getInventoryByIDs: async function (
    productID: ProductID,
    placementID: PlacementID,
    batchID: BatchID,
  ): Promise<Inventory | undefined> {
    return await inventory.getInventoryByIDs(productID, placementID, batchID)
  },
  createHistoryLog: async function (
    historyData: NewHistory,
  ): Promise<History | undefined> {
    return await inventory.createHitoryLog(historyData)
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
  ): Promise<boolean> {
    const result = await db.transaction(async trx => {
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
        throw new ActionError('Beholdning blev ikke opdateret, test')
      }

      return didUpsert && !!historyLog
    })

    return result
  },
  getProductsByID: async function (customerID: CustomerID): Promise<Product[]> {
    return await inventory.getProductsByID(customerID)
  },
  createPlacement: async function (
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
  createBatch: async function (
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
  getHistoryByLocationID: async function (
    locationID: LocationID,
  ): Promise<FormattedHistory[]> {
    return await inventory.getHistoryByLocationID(locationID)
  },
}

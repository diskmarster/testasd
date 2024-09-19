import { FormattedHistory, FormattedInventory } from '@/data/inventory.types'
import { db, TRX } from '@/lib/database'
import { userTable } from '@/lib/database/schema/auth'
import { CustomerID, LocationID } from '@/lib/database/schema/customer'
import {
  Batch,
  BatchID,
  batchTable,
  Group,
  groupTable,
  History,
  historyTable,
  Inventory,
  inventoryTable,
  NewBatch,
  NewGroup,
  NewHistory,
  NewInventory,
  NewPlacement,
  Placement,
  PlacementID,
  placementTable,
  Product,
  ProductID,
  productTable,
  Unit,
  unitTable,
} from '@/lib/database/schema/inventory'
import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm'

const PRODUCT_COLS = getTableColumns(productTable)
const PLACEMENT_COLS = getTableColumns(placementTable)
const BATCH_COLS = getTableColumns(batchTable)
const UNIT_COLS = getTableColumns(unitTable)
const GROUP_COLS = getTableColumns(groupTable)
const { hash, ...USER_COLS } = getTableColumns(userTable)
const HISTORY_COLS = getTableColumns(historyTable)

export const inventory = {
  getInventoryByLocationID: async function (
    locationID: LocationID,
    trx: TRX = db,
  ): Promise<FormattedInventory[]> {
    const inventory: FormattedInventory[] = await trx
      .select({
        inserted: inventoryTable.inserted,
        updated: inventoryTable.updated,
        quantity: inventoryTable.quantity,
        customerID: inventoryTable.customerID,
        locationID: inventoryTable.locationID,
        product: {
          ...PRODUCT_COLS,
          unit: UNIT_COLS.name,
          group: GROUP_COLS.name,
        },
        placement: { ...PLACEMENT_COLS },
        batch: { ...BATCH_COLS },
      })
      .from(inventoryTable)
      .where(eq(inventoryTable.locationID, locationID))
      .innerJoin(productTable, eq(productTable.id, inventoryTable.productID))
      .innerJoin(
        placementTable,
        eq(placementTable.id, inventoryTable.placementID),
      )
      .innerJoin(batchTable, eq(batchTable.id, inventoryTable.batchID))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
      .innerJoin(groupTable, eq(groupTable.id, productTable.groupID))

    return inventory
  },
  getUnits: async function (trx: TRX = db): Promise<Unit[]> {
    return await trx
      .select()
      .from(unitTable)
      .where(eq(unitTable.isBarred, false))
  },
  getGroupsByID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<Group[]> {
    return await trx
      .select()
      .from(groupTable)
      .where(
        and(
          eq(groupTable.isBarred, false),
          eq(groupTable.customerID, customerID),
        ),
      )
  },
  getAllGroupsByID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<Group[]> {
    return await trx
      .select()
      .from(groupTable)
      .where(eq(groupTable.customerID, customerID))
  },
  createProductGroup: async function (
    groupData: NewGroup,
    trx: TRX = db,
  ): Promise<Group> {
    const group = await trx.insert(groupTable).values(groupData).returning()
    return group[0]
  },

  getPlacementsByID: async function (
    locationID: LocationID,
    trx: TRX = db,
  ): Promise<Placement[]> {
    return await trx
      .select()
      .from(placementTable)
      .where(
        and(
          eq(placementTable.locationID, locationID),
          eq(placementTable.isBarred, false),
        ),
      )
  },
  getAllPlacementsByID: async function (
    locationID: LocationID,
    trx: TRX = db,
  ): Promise<Placement[]> {
    return await trx
      .select()
      .from(placementTable)
      .where(eq(placementTable.locationID, locationID))
  },
  getBatchesByID: async function (
    locationID: LocationID,
    trx: TRX = db,
  ): Promise<Batch[]> {
    return await trx
      .select()
      .from(batchTable)
      .where(
        and(
          eq(batchTable.locationID, locationID),
          eq(batchTable.isBarred, false),
        ),
      )
  },
  getInventoryByIDs: async function (
    productID: ProductID,
    placementID: PlacementID,
    batchID: BatchID,
    trx: TRX = db,
  ): Promise<Inventory | undefined> {
    const inventory = await trx
      .select()
      .from(inventoryTable)
      .where(
        and(
          eq(inventoryTable.productID, productID),
          eq(inventoryTable.placementID, placementID),
          eq(inventoryTable.batchID, batchID),
        ),
      )
    return inventory[0]
  },
  upsertInventory: async function (
    inventory: NewInventory,
    trx: TRX = db,
  ): Promise<boolean> {
    const resultSet = await trx
      .insert(inventoryTable)
      .values({ ...inventory })
      .onConflictDoUpdate({
        target: [
          inventoryTable.productID,
          inventoryTable.placementID,
          inventoryTable.batchID,
          inventoryTable.locationID,
          inventoryTable.customerID,
        ],
        set: {
          quantity: sql`${inventoryTable.quantity} + ${inventory.quantity}`,
        },
      })
    return resultSet.rowsAffected == 1
  },
  updateInventory: async function (
    productID: ProductID,
    placementID: PlacementID,
    batchID: BatchID,
    amount: number,
    trx: TRX = db,
  ): Promise<boolean> {
    const resultSet = await trx
      .update(inventoryTable)
      .set({
        quantity: sql`${inventoryTable.quantity} + ${amount}`,
      })
      .where(
        and(
          eq(inventoryTable.productID, productID),
          eq(inventoryTable.placementID, placementID),
          eq(inventoryTable.batchID, batchID),
        ),
      )
    return resultSet.rowsAffected == 1
  },
  createHitoryLog: async function (
    historyData: NewHistory,
    trx: TRX = db,
  ): Promise<History | undefined> {
    const history = await trx
      .insert(historyTable)
      .values(historyData)
      .returning()
    return history[0]
  },
  getProductsByID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<Product[]> {
    return await trx
      .select()
      .from(productTable)
      .where(
        and(
          eq(productTable.customerID, customerID),
          eq(productTable.isBarred, false),
        ),
      )
  },
  createPlacement: async function (
    placementData: NewPlacement,
    trx: TRX = db,
  ): Promise<Placement> {
    const placement = await trx
      .insert(placementTable)
      .values(placementData)
      .returning()
    return placement[0]
  },
  createBatch: async function (
    batchData: NewBatch,
    trx: TRX = db,
  ): Promise<Batch> {
    const batch = await trx.insert(batchTable).values(batchData).returning()
    return batch[0]
  },
  getHistoryByLocationID: async function (
    locationID: LocationID,
    trx: TRX = db,
  ): Promise<FormattedHistory[]> {
    const history = await trx
      .select({
        ...HISTORY_COLS,
        product: {
          ...PRODUCT_COLS,
          unit: UNIT_COLS.name,
          group: GROUP_COLS.name,
        },
        placement: { ...PLACEMENT_COLS },
        batch: { ...BATCH_COLS },
        user: { ...USER_COLS },
      })
      .from(historyTable)
      .where(eq(historyTable.locationID, locationID))
      .innerJoin(productTable, eq(productTable.id, historyTable.productID))
      .innerJoin(userTable, eq(userTable.id, historyTable.userID))
      .innerJoin(
        placementTable,
        eq(placementTable.id, historyTable.placementID),
      )
      .innerJoin(batchTable, eq(batchTable.id, historyTable.batchID))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
      .innerJoin(groupTable, eq(groupTable.id, productTable.groupID))
      .orderBy(desc(historyTable.inserted))

    return history
  },
}

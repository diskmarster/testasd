import { FormattedInventory, FormattedReorder } from '@/data/inventory.types'
import { db, TRX } from '@/lib/database'
import { attachmentsTable } from '@/lib/database/schema/attachments'
import { CustomerID, LocationID } from '@/lib/database/schema/customer'
import {
  Batch,
  BatchID,
  batchTable,
  Group,
  GroupID,
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
  NewReorder,
  NewUnit,
  PartialBatch,
  PartialGroup,
  PartialPlacement,
  PartialReorder,
  PartialUnit,
  Placement,
  PlacementID,
  placementTable,
  Product,
  ProductID,
  productTable,
  Reorder,
  reorderTable,
  Unit,
  UnitID,
  unitTable,
} from '@/lib/database/schema/inventory'
import { supplierTable } from '@/lib/database/schema/suppliers'
import { and, count, desc, eq, getTableColumns, sql } from 'drizzle-orm'

const PRODUCT_COLS = getTableColumns(productTable)
const PLACEMENT_COLS = getTableColumns(placementTable)
const BATCH_COLS = getTableColumns(batchTable)
const UNIT_COLS = getTableColumns(unitTable)
const GROUP_COLS = getTableColumns(groupTable)
const HISTORY_COLS = getTableColumns(historyTable)
const REORDER_COLS = getTableColumns(reorderTable)

export const inventory = {
  getInventoryByLocationID: async function (
    locationID: LocationID,
    pageSize: number = 5000,
    page: number = 1,
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
		  fileCount: count(attachmentsTable.id),
		  supplierName: supplierTable.name,
        },
        placement: { ...PLACEMENT_COLS },
        batch: { ...BATCH_COLS },
      })
      .from(inventoryTable)
      .where(eq(inventoryTable.locationID, locationID))
      .innerJoin(productTable, eq(productTable.id, inventoryTable.productID))
	  .leftJoin(attachmentsTable,
		 and(
			eq(attachmentsTable.refDomain, 'product'),
			eq(attachmentsTable.refID, inventoryTable.productID)
		 )
		)
      .innerJoin(
        placementTable,
        eq(placementTable.id, inventoryTable.placementID),
      )
      .innerJoin(batchTable, eq(batchTable.id, inventoryTable.batchID))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
      .innerJoin(groupTable, eq(groupTable.id, productTable.groupID))
	  .leftJoin(supplierTable, eq(supplierTable.id, productTable.supplierID))
	  .groupBy(
		inventoryTable.inserted,
		inventoryTable.updated,
		inventoryTable.quantity,
		inventoryTable.customerID,
		inventoryTable.locationID,
		productTable.id,
		UNIT_COLS.name,
		GROUP_COLS.name,
		placementTable.id,
		batchTable.id
	  )
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    return inventory
  },
  getActiveUnits: async function (trx: TRX = db): Promise<Unit[]> {
    return await trx
      .select()
      .from(unitTable)
      .where(eq(unitTable.isBarred, false))
  },
  getActiveGroupsByID: async function (
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

  getActivePlacementsByID: async function (
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
  getActiveBatchesByID: async function (
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
  getDefaultBatchByID: async function (
    locationID: LocationID,
    trx: TRX = db,
  ): Promise<Batch> {
    const batches = await trx
      .select()
      .from(batchTable)
      .where(
        and(
          eq(batchTable.locationID, locationID),
          eq(batchTable.isBarred, false),
          eq(batchTable.batch, '-'),
        ),
      )

    return batches[0]
  },
  getAllBatchesByID: async function (
    locationID: LocationID,
    trx: TRX = db,
  ): Promise<Batch[]> {
    return await trx
      .select()
      .from(batchTable)
      .where(eq(batchTable.locationID, locationID))
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
  createHistoryLog: async function (
    historyData: NewHistory,
    trx: TRX = db,
  ): Promise<History | undefined> {
    const history = await trx
      .insert(historyTable)
      .values(historyData)
      .returning()
    return history[0]
  },
  getActiveProductsByID: async function (
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
  ): Promise<History[]> {
    const history = await trx
      .select({
        ...HISTORY_COLS,
      })
      .from(historyTable)
      .where(eq(historyTable.locationID, locationID))
      .orderBy(desc(historyTable.inserted))

    return history
  },
  createReorder: async function (
    reorderData: NewReorder,
    trx: TRX = db,
  ): Promise<Reorder | undefined> {
    const newReorder = await trx
      .insert(reorderTable)
      .values(reorderData)
      .returning()
    return newReorder[0]
  },
  updateReorderByID: async function (
    productID: ProductID,
    locationID: LocationID,
    customerID: CustomerID,
    reorderData: PartialReorder,
    trx: TRX = db,
  ): Promise<boolean> {
    const resultSet = await trx
      .update(reorderTable)
      .set(reorderData)
      .where(
        and(
          eq(reorderTable.productID, productID),
          eq(reorderTable.locationID, locationID),
          eq(reorderTable.customerID, customerID),
        ),
      )
    return resultSet.rowsAffected == 1
  },
  deleteReorderByID: async function (
    productID: ProductID,
    locationID: LocationID,
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<boolean> {
    const resultSet = await trx
      .delete(reorderTable)
      .where(
        and(
          eq(reorderTable.productID, productID),
          eq(reorderTable.locationID, locationID),
          eq(reorderTable.customerID, customerID),
        ),
      )
    return resultSet.rowsAffected == 1
  },
  getReorderByProductID: async function (
    productID: ProductID,
    locationID: LocationID,
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<Reorder | undefined> {
    const reorder = await trx
      .select()
      .from(reorderTable)
      .where(
        and(
          eq(reorderTable.productID, productID),
          eq(reorderTable.locationID, locationID),
          eq(reorderTable.customerID, customerID),
        ),
      )
    return reorder[0]
  },
  getAllReordersByID: async function (
    locationID: LocationID,
    trx: TRX = db,
  ): Promise<Omit<FormattedReorder, 'recommended' | 'disposible'>[]> {
    const reorders = await trx
      .select({
        ...REORDER_COLS,
        quantity: sql<number>`sum(${inventoryTable.quantity})`.as('quantity'),
        product: {
          ...PRODUCT_COLS,
          unit: UNIT_COLS.name,
          group: GROUP_COLS.name,
		  supplierName: supplierTable.name,
        },
      })
      .from(reorderTable)
      .where(
        and(
          eq(reorderTable.locationID, locationID),
          eq(inventoryTable.locationID, locationID),
        ),
      )
      .innerJoin(productTable, eq(productTable.id, reorderTable.productID))
      .innerJoin(unitTable, eq(unitTable.id, productTable.unitID))
      .innerJoin(groupTable, eq(groupTable.id, productTable.groupID))
      .innerJoin(
        inventoryTable,
        eq(inventoryTable.productID, reorderTable.productID),
      )
	  .leftJoin(supplierTable, eq(supplierTable.id, productTable.supplierID))
      .groupBy(reorderTable.productID)

    return reorders
  },
  getInventoryByProductID: async (
    productID: ProductID,
  ): Promise<Inventory[]> => {
    return await db
      .select()
      .from(inventoryTable)
      .where(eq(inventoryTable.productID, productID))
  },
  getDefaultPlacementByID: async function (
    locationID: LocationID,
    trx: TRX = db,
  ): Promise<Placement> {
    const placement = await trx
      .select()
      .from(placementTable)
      .where(
        and(
          eq(placementTable.locationID, locationID),
          eq(placementTable.isBarred, false),
          eq(placementTable.name, '-'),
        ),
      )
    return placement[0]
  },
  createUnit: async function (unitData: NewUnit, trx: TRX = db): Promise<Unit> {
    const unit = await trx.insert(unitTable).values(unitData).returning()
    return unit[0]
  },
  updateUnitByID: async function (
    unitID: UnitID,
    updatedUnitData: PartialUnit,
    trx: TRX = db,
  ): Promise<Unit | undefined> {
    const unit = await trx
      .update(unitTable)
      .set({ ...updatedUnitData })
      .where(eq(unitTable.id, unitID))
      .returning()
    return unit[0]
  },
  getAllUnits: async function (trx: TRX = db): Promise<Unit[]> {
    return await trx.select().from(unitTable)
  },
  updateGroupByID: async function (
    groupID: GroupID,
    updatedGroupData: PartialGroup,
    trx: TRX = db,
  ): Promise<Group | undefined> {
    const group = await trx
      .update(groupTable)
      .set({ ...updatedGroupData })
      .where(eq(groupTable.id, groupID))
      .returning()
    return group[0]
  },

  updatePlacementByID: async function (
    placementID: PlacementID,
    updatedPlacementData: PartialPlacement,
    trx: TRX = db,
  ): Promise<Placement | undefined> {
    const placement = await trx
      .update(placementTable)
      .set({ ...updatedPlacementData })
      .where(eq(placementTable.id, placementID))
      .returning()
    return placement[0]
  },
  updateBatchByID: async function (
    batchID: BatchID,
    updatedBatchData: PartialBatch,
    trx: TRX = db,
  ): Promise<Batch | undefined> {
    const batch = await trx
      .update(batchTable)
      .set({ ...updatedBatchData })
      .where(eq(batchTable.id, batchID))
      .returning()
    return batch[0]
  },

  createInventory: async function (
    inventory: NewInventory,
    trx: TRX = db,
  ): Promise<Inventory | undefined> {
    const res = await trx.insert(inventoryTable).values(inventory).returning()
    return res[0]
  },
  getAllProductsByID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<Product[]> {
    return await trx
      .select()
      .from(productTable)
      .where(and(eq(productTable.customerID, customerID)))
  },
  getPlacementByID: async function (
    placementID: PlacementID,
    trx: TRX = db,
  ): Promise<Placement | undefined> {
    const [res] = await trx
      .select()
      .from(placementTable)
      .where(eq(placementTable.id, placementID))

    return res
  },
  getBatchByID: async function (
    batchID: BatchID,
    trx: TRX = db,
  ): Promise<Batch | undefined> {
    const [res] = await trx
      .select()
      .from(batchTable)
      .where(eq(batchTable.id, batchID))

    return res
  },
  createMany: async function (
    inventories: NewInventory[],
    trx: TRX = db,
  ): Promise<Inventory[]> {
    return await trx.insert(inventoryTable).values(inventories).returning()
  },
  getUnitByID: async function (
    unitID: UnitID,
    trx: TRX = db,
  ): Promise<Unit | undefined> {
    const [res] = await trx
      .select()
      .from(unitTable)
      .where(eq(unitTable.id, unitID))
    return res
  },
  getGroupByID: async function (
    groupID: GroupID,
    trx: TRX = db,
  ): Promise<Group | undefined> {
    const [res] = await trx
      .select()
      .from(groupTable)
      .where(eq(groupTable.id, groupID))
    return res
  },
}

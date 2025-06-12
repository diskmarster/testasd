import { serverTranslation } from '@/app/i18n'
import { fallbackLng } from '@/app/i18n/settings'
import { inventory } from '@/data/inventory'
import {
  FormattedInventory,
  FormattedReorder,
  HistoryFilter,
  HistoryPlatform,
  HistoryType,
  HistoryWithSums,
  InventoryAction,
  ProductInventory,
  MoveBetweenLocation,
  MoveBetweenLocationResponse,
} from '@/data/inventory.types'
import { product } from '@/data/products'
import { db, TRX } from '@/lib/database'
import { UserID } from '@/lib/database/schema/auth'
import { CustomerID, Location, LocationID } from '@/lib/database/schema/customer'
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
  NewUnit,
  PartialBatch,
  PartialGroup,
  PartialPlacement,
  PartialUnit,
  Placement,
  PlacementID,
  Product,
  ProductID,
  Unit,
  UnitID,
} from '@/lib/database/schema/inventory'
import { ActionError } from '@/lib/safe-action/error'
import { LibsqlError } from '@libsql/client'
import { productService } from './products'
import { userService } from './user'
import { locationService } from './location'
import { NewReorder, PartialReorder, Reorder } from '@/lib/database/schema/reorders'
import { customerService } from './customer'
import { emailService } from './email'
import { EmailSendReorder } from '@/components/email/email-reorder'
import { PartialRequired } from '@/lib/types'
import { location } from '@/data/location'
import { ApiError } from 'next/dist/server/api-utils'

const EMAIL_LINK_BASEURL =
  process.env.VERCEL_ENV === 'production'
    ? 'https://lager.nemunivers.app'
    : process.env.VERCEL_ENV === 'preview'
      ? 'stage.lager.nemunivers.app'
      : 'http://localhost:3000'

export const inventoryService = {
  getInventory: async function(
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
  getActiveUnits: async function(): Promise<Unit[]> {
    return inventory.getActiveUnits()
  },
  getActiveGroupsByID: async function(
    customerID: CustomerID,
  ): Promise<Group[]> {
    return await inventory.getActiveGroupsByID(customerID)
  },
  getAllGroupsByID: async function(customerID: CustomerID): Promise<Group[]> {
    return await inventory.getAllGroupsByID(customerID)
  },
  getActivePlacementsByID: async function(
    locationID: LocationID,
  ): Promise<Placement[]> {
    return await inventory.getActivePlacementsByID(locationID)
  },
  getAllPlacementsByID: async function(
    locationID: LocationID,
  ): Promise<Placement[]> {
    return await inventory.getAllPlacementsByID(locationID)
  },
  getActiveBatchesByID: async function(
    locationID: LocationID,
  ): Promise<Batch[]> {
    return await inventory.getActiveBatchesByID(locationID)
  },
  getAllBatchesByID: async function(locationID: LocationID): Promise<Batch[]> {
    return await inventory.getAllBatchesByID(locationID)
  },
  getInventoryByIDs: async function(
    productID: ProductID,
    placementID: PlacementID,
    batchID: BatchID,
  ): Promise<Inventory | undefined> {
    return await inventory.getInventoryByIDs(productID, placementID, batchID)
  },
  createHistoryLog: async function(
    historyData: {
      customerID: CustomerID
      locationID: LocationID
      productID: ProductID
      placementID: PlacementID
      batchID: BatchID
      userID: UserID | null
      type: 'tilgang' | 'afgang' | 'regulering' | 'flyt'
      platform: HistoryPlatform
      amount: number
      reference: string | undefined
			currentQuantity: number
			apikeyName: string | null
    },
    trx?: TRX,
  ): Promise<History | undefined> {
    const historyLogData: NewHistory = {
      ...historyData,
    }

		const promises = []

    // fetch product info
    promises.push(productService
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
      }))
    // fetch user info
		if (historyData.userID) {
			promises.push(userService.getByID(historyData.userID).then(user => {
				historyLogData.userName = user?.name
				historyLogData.userRole = user?.role
			}))
		} else {
			historyLogData.userName = `API (${historyData.apikeyName})`
		}
    // fetch placement info
    promises.push(this.getPlacementByID(
      historyData.placementID,
    ).then(placement => {
      historyLogData.placementName = placement?.name
    }))
    // fetch batch info
    promises.push(this.getBatchByID(historyData.batchID).then(batch => {
      historyLogData.batchName = batch?.batch
    }))

    await Promise.all(promises)

    return await inventory.createHistoryLog(historyLogData, trx)
  },
  upsertInventory: async function(
    platform: HistoryPlatform,
    customerID: CustomerID,
    userID: UserID | null,
    locationID: LocationID,
    productID: ProductID,
    placementID: PlacementID,
    batchID: BatchID,
    type: HistoryType,
    amount: number,
    reference: string = '',
		apikeyName: string | null = null,
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

      const productCheck = await product.getByID(productID, trx)
      if (productCheck && productCheck.isBarred) {
        throw new ActionError(t('inventory-service-action.restock-barred'))
      }

	  if (type == 'tilgang') {
		  const placement = await inventory.getPlacementByID(placementID, trx)
		  if (!placement) {
			  throw new ActionError(
				  t('inventory-service-action.placement-not-exists'),
			  )
		  }
		  if (placement.isBarred) {
			  throw new ActionError(
				  t('inventory-service-action.placement-is-barred'),
			  )
		  }

		  const batch = await inventory.getBatchByID(batchID, trx)
		  if (!batch) {
			  throw new ActionError(
				  t('inventory-service-action.batch-not-exists'),
			  )
		  }
		  if (batch.isBarred) {
			  throw new ActionError(
				  t('inventory-service-action.batch-is-barred'),
			  )
		  }

		  if (isReorderOnProduct && isReorderOnProduct.ordered > 0) {

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

			const newAmount = await inventory.getProductInventory(locationID, productID, trx)
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
					currentQuantity: newAmount,
					apikeyName,
        },
        trx,
      )
      if (!historyLog) {
        throw new ActionError(
          t('inventory-service-action.inventory-not-updated'),
        )
      }

      if (type == 'afgang') {
        const newAmount = await inventory.getProductInventory(locationID, productID, trx)

        if (isReorderOnProduct &&
          isReorderOnProduct.minimum > (newAmount + isReorderOnProduct.ordered)
        ) {
          const otherReorders = await inventory.getAllReordersByID(locationID, trx)
            .then(rs => rs.filter(r => r.productID != productID))

          if (otherReorders.every(r => !r.isRequested && r.minimum <= (r.quantity + r.ordered))) {
            const mailSettings = await customerService.getMailSettingsForIDs(
              customerID,
              locationID,
              'sendReorderMail',
            )

            const mailPromises = mailSettings.map(setting => {
              const email = setting.userID ? setting.userEmail! : setting.email!

              return emailService.sendRecursively(
                [email],
                'Der er nye varer til genbestil i NemLager',
                EmailSendReorder({
                  mailInfo: setting,
                  link: `${EMAIL_LINK_BASEURL}/${lang}/genbestil`,
                })
              )
            })

            await Promise.all(mailPromises)
          }
        }
      }

      return didUpsert && !!historyLog
    })

    return result
  },
  moveInventory: async function(
    platform: HistoryPlatform,
    customerID: CustomerID,
    userID: UserID | null,
    locationID: LocationID,
    productID: ProductID,
    fromPlacementID: PlacementID,
    fromBatchID: BatchID,
    toPlacementID: PlacementID,
    type: HistoryType,
    amount: number,
    reference: string = '',
    lang: string = fallbackLng,
		apikeyName: string | null
  ): Promise<boolean> {
    const { t } = await serverTranslation(lang, 'action-errors')
    const result = await db.transaction(async trx => {
      const productCheck = await product.getByID(productID, trx)
      if (productCheck && productCheck.isBarred) {
        throw new ActionError(t('inventory-service-action.move-barred'))
      }

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
			const newAmountFrom = await inventory.getProductInventory(locationID, productID, trx)

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
			const newAmountTo = await inventory.getProductInventory(locationID, productID, trx)

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
					currentQuantity: newAmountFrom,
					apikeyName,
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
					currentQuantity: newAmountTo,
					apikeyName,
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
  getActiveProductsByID: async function(
    customerID: CustomerID,
  ): Promise<Product[]> {
    return await inventory.getActiveProductsByID(customerID)
  },
  getAllProductsByID: async function(
    customerID: CustomerID,
  ): Promise<Product[]> {
    return await inventory.getAllProductsByID(customerID)
  },
  createPlacement: async function(
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
  createProductGroup: async function(
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

  createBatch: async function(
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
  getHistoryByLocationID: async function(
    locationID: LocationID,
		filter?: HistoryFilter,
  ): Promise<HistoryWithSums[]> {

    const history = await inventory.getHistoryByLocationID(locationID, filter)

    const newHistory = history.map(h => ({
      ...h,
      costTotal: h.amount * (h.productCostPrice ?? 0),
      salesTotal: h.amount * (h.productSalesPrice ?? 0)
    }))

    return newHistory
  },
  createReorder: async function(
    reorderData: NewReorder,
    lang: string = fallbackLng,
  ): Promise<Reorder | undefined> {
    const { t } = await serverTranslation(lang, 'action-errors')

    const productCheck = await product.getByID(reorderData.productID)
    if (productCheck && productCheck.isBarred) {
      throw new ActionError(t('inventory-service-action.reorder-barred'))
    }

    return await inventory.createReorder(reorderData)
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
    reorderData: PartialReorder,
  ): Promise<boolean> {
    return await inventory.updateReorderByID(
      productID,
      locationID,
      customerID,
      reorderData,
    )
  },
  getReordersByID: async function(
    locationID: LocationID,
    {withRequested = true}: {withRequested?: boolean} = {},
  ): Promise<FormattedReorder[]> {
    const reorders = await inventory.getAllReordersByID(locationID)

    const newReorders = reorders.filter(reorder => withRequested || !reorder.isRequested).map(reorder => {
      const disposible = reorder.quantity + reorder.ordered
      const shouldReorder = disposible < (reorder.minimum ?? 0)

      return {
        ...reorder,
        disposible,
        shouldReorder,
      }
    })

    return newReorders
  },
  getInventoryByProductID: async function(
    productID: ProductID,
  ): Promise<Inventory[]> {
    return await inventory.getInventoryByProductID(productID)
  },
  getProductInventoryForLocationIDs: async function(
    productID: ProductID,
		locationIDs: LocationID[],
  ): Promise<ProductInventory[]> {
    return await inventory.getProductInventoryForLocations(productID, locationIDs)
  },
  getProductInventoryForLocations: async function<TLocation extends PartialRequired<Location, 'id'>>(
    productID: ProductID,
		locations: TLocation[],
  ): Promise<Map<TLocation, ProductInventory[]>> {
    const inventories = await inventory.getProductInventoryForLocations(productID, locations.map(l => l.id))

		const map = new Map<TLocation, ProductInventory[]>
		for (const inventory of inventories) {
			const loc = locations.find(l => l.id == inventory.locationID)
			if (loc == undefined) {
				continue
			}

			const cur = map.get(loc) ?? []
			cur.push(inventory)
			map.set(loc, cur)
		}

		return map
  },
  createUnit: async function(
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
  updateUnitByID: async function(
    unitID: UnitID,
    updatedUnitData: PartialUnit,
  ): Promise<Unit | undefined> {
    const updatedUnit = await inventory.updateUnitByID(unitID, updatedUnitData)
    if (!updatedUnit) return undefined
    return updatedUnit
  },

  updateUnitBarredStatus: async function(
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
  getAllUnits: async function(): Promise<Unit[]> {
    return await inventory.getAllUnits()
  },

  updateGroupByID: async function(
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

  updatePlacementByID: async function(
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
  updateBatchByID: async function(
    batchID: BatchID,
    updatedBatchData: PartialBatch,
  ): Promise<Batch | undefined> {
    const updatedBatch = await inventory.updateBatchByID(
      batchID,
      updatedBatchData,
    )
    if (!updatedBatch) return undefined
    return updatedBatch
  },

  updateGroupBarredStatus: async function(
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
  updatePlacementBarredStatus: async function(
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
  updateBatchBarredStatus: async function(
    batchID: BatchID,
    isBarred: boolean,
  ): Promise<Batch | undefined> {
    try {
      const updatedBatch = await inventory.updateBatchByID(batchID, {
        isBarred,
      })
      if (!updatedBatch) return undefined
      return updatedBatch
    } catch (err) {
      console.error('Der skete en fejl med spærringen:', err)
    }
  },

  createInventory: async function(
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
  getPlacementByID: async function(
    placementID: PlacementID,
  ): Promise<Placement | undefined> {
    return await inventory.getPlacementByID(placementID)
  },
  getBatchByID: async function(batchID: BatchID): Promise<Batch | undefined> {
    return await inventory.getBatchByID(batchID)
  },
  getReorderByIDs: async function(
    productID: ProductID,
    customerID: CustomerID,
    userID: UserID
  ): Promise<Reorder | undefined> {
    const locationID = await locationService.getLastVisited(userID)
    if (!locationID) return undefined
    return await inventory.getReorderByProductID(productID, locationID, customerID)
  },
  upsertReorder: async function(
    reorderData: NewReorder,
  ): Promise<Reorder | undefined> {
    return await inventory.upsertReorder(reorderData)
  },
  getActionsForUser: async function(
    userID: UserID,
    timePeriod?: {
      from: Date,
      to?: Date,
    }
  ): Promise<InventoryAction[]> {
    const period = 
      timePeriod == undefined 
        ? undefined
        : {
          from: timePeriod.from,
          to: timePeriod.to ?? new Date()
        }

    const actions = await inventory.getHistoryForUserID(userID, period)

    return actions.map(a => ({
      productSku: a.productSku,
      productText1: a.productText1,
      amount: a.amount,
      type: a.type,
    }))
  },
  moveBetweenLocations: async function(
	  customerID: CustomerID,
	  userID: UserID | null,
	  apiKeyName: string | null,
	  platform: HistoryPlatform,
	  data: MoveBetweenLocation,
	  lang: string = fallbackLng,
  ): Promise<MoveBetweenLocationResponse> {
	  const { t } = await serverTranslation(lang, 'action-errors')

	  if (platform == "ext" && apiKeyName == null) {
			throw new ApiError(400, t("locations-move.missing-apikey"))
	  } else if (platform != "ext" && userID == null) {
			throw new ApiError(400, t("locations-move.missing-user-id"))
	  }

	  const {fromLocation, toLocation, reference = "", items} = data

	  const allPlacements = await inventory.getAllPlacementsByID(toLocation)
	  const allBatches = await inventory.getAllBatchesByID(toLocation)
	  const allLocations = await location.getAllByCustomerID(customerID)

	  let defaultPlacement = allPlacements.find(p => p.name == "-")
	  let defaultBatch = allBatches.find(b => b.batch == "-")

	  let fromLocationInfo = allLocations.find(l => l.id == fromLocation)
	  let toLocationInfo = allLocations.find(l => l.id == toLocation)

	  if (!defaultPlacement) {
		  defaultPlacement = await inventory.createPlacement({
			  name: "-",
			  locationID: toLocation,
		  })
	  }

	  if (!defaultBatch) {
		  defaultBatch = await inventory.createBatch({
			  batch: "-",
			  locationID: toLocation,
		  })
	  }

	  let response: MoveBetweenLocationResponse = { success: true, errors: [] }

	  await db.transaction(async tx => {
		  for (const i of items) {
			  // from actions
			  const didUpsertFrom = await inventory.upsertInventory({
				  customerID: customerID,	
				  locationID: fromLocation,
				  productID: i.productID,
				  placementID: i.fromPlacementID,
				  batchID: i.fromBatchID,
				  quantity: -i.quantity,
			  }, tx)

			  if (!didUpsertFrom) {
				  response.success = false
				  response.errors.push({
					  productID: i.productID,
					  message: t("locations-move.from-upsert-failed", { sku: i.sku })
				  })
				  continue
			  }

			  const newQuantityFrom = await inventory.getProductInventory(fromLocation, i.productID, tx)

			  await this.createHistoryLog({
				  customerID: customerID,
				  locationID: fromLocation,
				  type: 'flyt',
				  productID: i.productID,
				  placementID: i.fromPlacementID,
				  batchID: i.fromBatchID,
				  amount: -i.quantity,
				  currentQuantity: newQuantityFrom,
				  platform: platform,
				  reference: reference.concat(t("locations-move.to-location", {location: toLocationInfo?.name})).trim(),
				  userID: userID,
				  apikeyName: apiKeyName,
			  }, tx)

			  // to actions
			   const didUpsertTo = await inventory.upsertInventory({
			    customerID: customerID,	
			    locationID: toLocation,
			    productID: i.productID,
			    placementID: i.toPlacementID ? i.toPlacementID : defaultPlacement.id,
			    batchID: i.toBatchID ? i.toBatchID : defaultBatch.id,
			    quantity: i.quantity,
			   }, tx)

			  if (!didUpsertTo) {
				  response.success = false
				  response.errors.push({
					  productID: i.productID,
					  message: t("locations-move.to-upsert-failed", { sku: i.sku })
				  })
				  continue
			  }

			   const newQuantityTo = await inventory.getProductInventory(toLocation, i.productID, tx)

			   await this.createHistoryLog({
			  	customerID: customerID,
			  	locationID: toLocation,
			  	type: 'flyt',
			  	productID: i.productID,
			  	placementID: i.toPlacementID ? i.toPlacementID : defaultPlacement.id,
			  	batchID: i.toBatchID ? i.toBatchID : defaultBatch.id,
			  	amount: i.quantity,
			  	currentQuantity: newQuantityTo,
			  	platform: platform,
			  	reference: reference.concat(t("locations-move.from-location", { location: fromLocationInfo?.name })).trim(),
				userID: userID,
				apikeyName: apiKeyName,
			  }, tx)
		  }
	  })

	  return response
  }
}


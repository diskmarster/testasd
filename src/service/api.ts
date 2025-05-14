import { CustomerID } from '@/lib/database/schema/customer'
import { CreateRegulation } from './api.utils'
import { inventoryService } from './inventory'

export const apiService = {
  regulateInventory: async function (
    customerID: CustomerID,
    data: CreateRegulation,
  ): Promise<boolean> {
    let placementId: number
    if (typeof data.placementId == 'string') {
      // Create new placement or fetch default for location
      if (data.placementId == '') {
        // fetch default
        const placements = await inventoryService.getActivePlacementsByID(
          data.locationId,
        )
        let defaultPlacement = placements.find(p => p.name == '-')
        if (defaultPlacement == undefined) {
          defaultPlacement = await inventoryService.createPlacement({
            locationID: data.locationId,
            name: '-',
          })

          if (defaultPlacement == undefined) {
            // const msg = t(
            //   'route-translations-regulations.error-while-moving-placement',
            // )

            return false
          }
        }
        placementId = defaultPlacement.id
      } else {
        const res = await inventoryService.createPlacement({
          locationID: data.locationId,
          name: data.placementId,
        })
        if (res == undefined) {
          // const msg = t(
          //   'route-translations-regulations.error-creating-placement-db',
          // )

          return false
        }
        placementId = res.id
      }
    } else if (typeof data.placementId == 'number') {
      placementId = data.placementId
    } else {
      // data.placementId should be undefined
      // Then fetch default placement for location
      const placements = await inventoryService.getActivePlacementsByID(
        data.locationId,
      )
      let defaultPlacement = placements.find(p => p.name == '-')
      if (defaultPlacement == undefined) {
        defaultPlacement = await inventoryService.createPlacement({
          locationID: data.locationId,
          name: '-',
        })

        if (defaultPlacement == undefined) {
          // const msg = t(
          //   'route-translations-regulations.error-while-moving-placement',
          // )

          return false
        }
      }
      placementId = defaultPlacement.id
    }

    let batchId: number
    if (typeof data.batchId == 'string') {
      // Create new placement or fetch default for location
      if (data.batchId == '') {
        // fetch default
        const batches = await inventoryService.getActiveBatchesByID(
          data.locationId,
        )
        let defaultBatch = batches.find(b => b.batch == '-')
        if (defaultBatch == undefined) {
          defaultBatch = await inventoryService.createBatch({
            locationID: data.locationId,
            batch: '-',
          })

          if (defaultBatch == undefined) {
            // const msg = t(
            //   'route-translations-regulations.error-while-moving-batch',
            // )

            return false
          }
        }
        batchId = defaultBatch.id
      } else {
        const res = await inventoryService.createBatch({
          locationID: data.locationId,
          batch: data.batchId,
        })
        if (res == undefined) {
          // const msg = t(
          //   'route-translations-regulations.error-creating-batch-db',
          // )

          return false
        }
        batchId = res.id
      }
    } else if (typeof data.batchId == 'number') {
      batchId = data.batchId
    } else {
      // data.batchId should be undefined
      // Then fetch default placement for location
      const batches = await inventoryService.getActiveBatchesByID(
        data.locationId,
      )
      let defaultBatch = batches.find(b => b.batch == '-')
      if (defaultBatch == undefined) {
        defaultBatch = await inventoryService.createBatch({
          locationID: data.locationId,
          batch: '-',
        })

        if (defaultBatch == undefined) {
          // const msg = t(
          //   'route-translations-regulations.error-while-moving-batch',
          // )

          return false
        }
      }
      batchId = defaultBatch.id
    }

    if (
      !(await inventoryService.upsertInventory(
        'app',
        customerID,
        -1,
        data.locationId,
        data.productId,
        placementId,
        batchId,
        data.type,
        data.quantity,
        data.reference ?? '',
      ))
    ) {
      // const msg = `${t('route-translations-regulations.error-creating-new')} ${data.type}, ${t('route-translations-regulations.try-again')}`

      return false
    }

    return true
  },
}

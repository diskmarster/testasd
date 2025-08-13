import { fallbackLng } from '@/app/i18n/settings'
import {
	HistoryPlatform,
	MoveBetweenLocation,
	MoveBetweenLocationResponse,
} from '@/data/inventory.types'
import { UserID } from '@/lib/database/schema/auth'
import { CustomerID } from '@/lib/database/schema/customer'
import { TFunction } from 'i18next'
import { CreateRegulation } from './api.utils'
import { inventoryService } from './inventory'

export const apiService = {
	regulateInventory: async function (
		customerID: CustomerID,
		userID: UserID | null,
		apikeyName: string | null,
		platform: HistoryPlatform,
		data: CreateRegulation,
		t: TFunction<'common', 'route-translations-regulations'>,
	): Promise<
		| { ok: true; status?: undefined; error?: undefined }
		| { ok: false; status: 400 | 500; error: string }
	> {
		let defaultPlacement = await inventoryService
			.getDefaultPlacementForProductAndLocation(data.productId, data.locationId)
			.then(dp => dp?.placement)

		let placementId: number
		if (typeof data.placementId == 'string') {
			// Create new placement or fetch default for location
			if (data.placementId == '') {
				// fetch default
				const placements = await inventoryService.getActivePlacementsByID(
					data.locationId,
				)
				if (defaultPlacement == undefined) {
					defaultPlacement = placements.find(p => p.name == '-')
					if (defaultPlacement == undefined) {
						defaultPlacement = await inventoryService.createPlacement({
							locationID: data.locationId,
							name: '-',
						})

						if (defaultPlacement == undefined) {
							// const msg = t(
							//   'route-translations-regulations.error-while-moving-placement',
							// )

							return {
								ok: false,
								status: 500,
								error: t('error-creating-placement-db'),
							}
						}
					}
				}
				placementId = defaultPlacement.id
			} else {
				if (defaultPlacement) {
					return {
						ok: false,
						status: 400,
						error: t('error-not-default-placement-selected'),
					}
				}

				const res = await inventoryService.createPlacement({
					locationID: data.locationId,
					name: data.placementId,
				})
				if (res == undefined) {
					// const msg = t(
					//   'route-translations-regulations.error-creating-placement-db',
					// )

					return {
						ok: false,
						status: 500,
						error: t('error-creating-placement-db'),
					}
				}
				placementId = res.id
			}
		} else if (typeof data.placementId == 'number') {
			if (defaultPlacement && data.placementId != defaultPlacement.id) {
				return {
					ok: false,
					status: 400,
					error: t('error-not-default-placement-selected'),
				}
			}

			placementId = data.placementId
		} else {
			// data.placementId should be undefined
			// Then fetch default placement for location
			const placements = await inventoryService.getActivePlacementsByID(
				data.locationId,
			)
			if (defaultPlacement == undefined) {
				defaultPlacement = placements.find(p => p.name == '-')
				if (defaultPlacement == undefined) {
					defaultPlacement = await inventoryService.createPlacement({
						locationID: data.locationId,
						name: '-',
					})

					if (defaultPlacement == undefined) {
						// const msg = t(
						//   'route-translations-regulations.error-while-moving-placement',
						// )

						return {
							ok: false,
							status: 500,
							error: t('error-creating-placement-db'),
						}
					}
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

						return {
							ok: false,
							status: 500,
							error: t('error-creating-batch-db'),
						}
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

					return { ok: false, status: 500, error: t('error-creating-batch-db') }
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

					return { ok: false, status: 500, error: t('error-creating-batch-db') }
				}
			}
			batchId = defaultBatch.id
		}

		if (
			!(await inventoryService.upsertInventory(
				platform,
				customerID,
				userID,
				data.locationId,
				data.productId,
				placementId,
				batchId,
				data.type,
				data.quantity,
				data.reference ?? '',
				apikeyName,
			))
		) {
			const msg = `${t('error-creating-new')} ${data.type}, ${t('try-again')}`

			return { ok: false, status: 500, error: msg }
		}

		return { ok: true }
	},
	moveInventoryBetweenLocations: async function (
		customerID: CustomerID,
		userID: UserID | null,
		apiKeyName: string | null,
		platform: HistoryPlatform,
		data: MoveBetweenLocation,
		lang: string = fallbackLng,
	): Promise<MoveBetweenLocationResponse> {
		return inventoryService.moveBetweenLocations(
			customerID,
			userID,
			apiKeyName,
			platform,
			data,
			lang,
		)
	},
}

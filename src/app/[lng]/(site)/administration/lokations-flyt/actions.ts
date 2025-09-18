'use server'

import { serverTranslation } from '@/app/i18n'
import { MoveBetweenLocation } from '@/data/inventory.types'
import { Batch, Placement } from '@/lib/database/schema/inventory'
import { adminAction } from '@/lib/safe-action'
import { inventoryService } from '@/service/inventory'
import { z } from 'zod'
import { moveBetweenLocationsSchema } from './validation'

export type Error = {
	index: number
	type: 'from-placement' | 'from-batch' | 'to-location' | 'quantity'
	message: string
}

export const moveInventoriesBetweenLocations = adminAction
	.schema(moveBetweenLocationsSchema)
	.action(async ({ parsedInput, ctx: { user, lang } }) => {
		const { t } = await serverTranslation(lang, 'lokations-flyt', {
			keyPrefix: 'server',
		})

		const errors: Error[] = []

		const inventories = await inventoryService.getInventory(
			user.customerID,
			parsedInput.fromLocation,
		)

		const defaultPlacements =
			await inventoryService.getDefaultPlacementForLocation(
				parsedInput.fromLocation,
			)
		const defaultPlacementMap = defaultPlacements.reduce((acc, cur) => {
			const sku = cur.product.sku
			if (!acc.has(sku)) {
				acc.set(sku, cur.placementID)
			}
			return acc
		}, new Map<string, number>())

		const placements = new Map<string, Placement[]>()
		const seenPlacementNames = new Map<string, Set<string>>()

		for (const cur of inventories) {
			const sku = cur.product.sku
			if (!placements.has(sku)) {
				placements.set(sku, [])
				seenPlacementNames.set(sku, new Set())
			}

			const placementNames = seenPlacementNames.get(sku)!
			if (!placementNames.has(cur.placement.name)) {
				placements.get(sku)!.push(cur.placement)
				placementNames.add(cur.placement.name)
			}
		}

		const batches = inventories.reduce((acc, cur) => {
			const skuPlacementKey = `${cur.product.sku}-${cur.placement.id}`
			if (!acc.has(skuPlacementKey)) {
				acc.set(skuPlacementKey, [])
			}
			acc.get(skuPlacementKey)!.push(cur.batch)
			return acc
		}, new Map<string, Batch[]>())

		const moveDataMap = new Map<string, MoveBetweenLocation>()

		for (let i = 0; i < parsedInput.fields.length; i++) {
			const field = parsedInput.fields[i]

			if (field.quantity <= 0) {
				errors.push({
					index: i,
					type: 'quantity',
					message: t('nonpositive-quantity-error', { sku: field.sku }),
				})
				continue
			}

			if (!moveDataMap.has(field.toLocationID)) {
				moveDataMap.set(field.toLocationID, {
					fromLocation: parsedInput.fromLocation,
					toLocation: field.toLocationID,
					reference: parsedInput.reference,
					items: [],
				})
			}

			let moveData = moveDataMap.get(field.toLocationID)!
			let fromPlacementID = field.fromPlacementID

			if (!fromPlacementID) {
				const productPlacements = placements.get(field.sku)!
				if (productPlacements.length > 0) {
					fromPlacementID =
						productPlacements.find(p => p.name == '-')?.id ??
						productPlacements[0].id
				} else {
					errors.push({
						index: i,
						type: 'from-placement',
						message: t('invalid-placement-error', { sku: field.sku }),
					})
					continue
				}
			}

			const defaultPlacement = defaultPlacementMap.get(field.sku)
			if (defaultPlacement && defaultPlacement != fromPlacementID) {
				errors.push({
					index: i,
					type: 'from-placement',
					message: t('not-default-placement-error', {
						sku: field.sku,
						placement: defaultPlacements.find(
							p => p.placementID == defaultPlacement,
						)!.placement.name,
					}),
				})
				continue
			}

			let fromBatchID = field.fromBatchID
			if (!fromBatchID) {
				const productBatches = batches.get(`${field.sku}-${fromPlacementID}`)!
				if (productBatches.length > 0) {
					fromBatchID =
						productBatches.find(b => b.batch == '-')?.id ?? productBatches[0].id
				} else {
					errors.push({
						index: i,
						type: 'from-batch',
						message: t('invalid-batch-error', {
							sku: field.sku,
							placement: placements
								.get(field.sku)!
								.find(p => p.id == fromPlacementID)!.name,
						}),
					})
					continue
				}
			}

			moveData.items.push({
				productID: field.productID,
				sku: field.sku,
				fromPlacementID: fromPlacementID,
				fromBatchID: fromBatchID,
				quantity: field.quantity,
			})

			moveDataMap.set(field.toLocationID, moveData)
		}

		if (errors.length > 0) {
			console.log('Lokations flyt errors: ', errors)
			return {
				ok: false,
				errors: errors,
			}
		}

		const movePromises = Array.from(moveDataMap.values()).map(data =>
			inventoryService.moveBetweenLocations(
				user.customerID,
				user.id,
				null,
				'web',
				data,
				lang,
			),
		)

		await Promise.all(movePromises)

		return {
			ok: true,
			errors: [],
		}
	})

export const getLocationInventories = adminAction
	.schema(z.object({ locationID: z.string() }))
	.action(async ({ ctx: { user }, parsedInput: { locationID } }) => {
		return await inventoryService.getInventory(user.customerID, locationID)
	})

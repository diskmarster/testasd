import { serverTranslation } from '@/app/i18n'
import { fallbackLng } from '@/app/i18n/settings'
import { inventory } from '@/data/inventory'
import { location } from '@/data/location'
import {
	LocationAccessesWithName,
	LocationWithCounts,
} from '@/data/location.types'
import { user } from '@/data/user'
import { hasPermissionByRank } from '@/data/user.types'
import { db } from '@/lib/database'
import { UserID } from '@/lib/database/schema/auth'
import {
	CustomerID,
	LinkLocationToUser,
	Location,
	LocationID,
	LocationWithPrimary,
	NewLinkLocationToUser,
	NewLocation,
} from '@/lib/database/schema/customer'
import { NewInventory } from '@/lib/database/schema/inventory'
import { ActionError } from '@/lib/safe-action/error'
import { addDays } from 'date-fns'
import { generateIdFromEntropySize } from 'lucia'
import { cookies } from 'next/headers'
import { productService } from './products'

const LAST_LOCATION_COOKIE_NAME = 'nl_last_location'
const LAST_LOCATION_COOKIE_DURATION_D = 14

export const locationService = {
	create: async function (
		locationData: NewLocation,
	): Promise<Location | undefined> {
		const didCreate = await db.transaction(async trx => {
			const newLocation = await location.create(locationData, trx)
			if (!newLocation) return undefined

			const newDefaultPlacement = await inventory.createPlacement(
				{
					name: '-',
					locationID: newLocation.id,
				},
				trx,
			)
			if (!newDefaultPlacement) return undefined
			const newBatch = await inventory.createBatch(
				{ batch: '-', locationID: newLocation.id },
				trx,
			)
			if (!newBatch) return undefined
			return newLocation
		})
		return didCreate
	},
	addAccess: async function (newLink: NewLinkLocationToUser): Promise<boolean> {
		return await location.createAccess(newLink)
	},
	getAllByUserID: async function (
		userID: UserID,
	): Promise<LocationWithPrimary[]> {
		const u = await user.getByID(userID)
		if (!u) return []
		if (hasPermissionByRank(u.role, 'administrator')) {
			const primaryLocation = await location.getPrimary(userID)

			const customerLocations = await location.getAllByCustomerID(u?.customerID)

			return customerLocations.map(loc => ({
				...loc,
				isPrimary: loc.id == primaryLocation?.id,
			}))
		} else {
			return await location.getAllByUserID(userID)
		}
	},
	setCookie: function (locationID: LocationID): void {
		cookies().set(LAST_LOCATION_COOKIE_NAME, locationID.toString(), {
			httpOnly: true,
			secure: process.env.VERCEL_ENV === 'production',
			expires: addDays(new Date(), LAST_LOCATION_COOKIE_DURATION_D),
		})
	},
	deleteCookie: function (): void {
		cookies().delete(LAST_LOCATION_COOKIE_NAME)
	},
	getLastVisited: async function (
		userID: UserID,
	): Promise<LocationID | undefined> {
		let defaultLocationID
		const u = await user.getByID(userID)
		if (!u) return undefined

		let locations = []
		if (hasPermissionByRank(u?.role, 'administrator')) {
			const primaryLocation = await location.getPrimary(userID)

			const customerLocations = await location.getAllByCustomerID(u?.customerID)

			locations = customerLocations.map(loc => ({
				...loc,
				isPrimary: loc.id == primaryLocation?.id,
			}))
		} else {
			locations = await location.getAllByUserID(userID)
		}

		if (locations.length == 0) return undefined

		const locationCookie = cookies().get(LAST_LOCATION_COOKIE_NAME)
		const primaryLocation = locations.find(loc => loc.isPrimary)
		if (!primaryLocation) {
			defaultLocationID = locations[0].id
		} else {
			defaultLocationID = primaryLocation.id
		}

		if (locationCookie) {
			const cookieLocationExists = locations.some(
				loc => loc.id === locationCookie.value,
			)
			defaultLocationID = cookieLocationExists
				? locationCookie.value
				: defaultLocationID
		}

		return defaultLocationID
	},
	toggleLocationPrimary: async function (
		customerID: CustomerID,
		userID: UserID,
		newLocationID: LocationID,
	): Promise<boolean> {
		const didUpdate = await location.toggleLocationPrimary(
			customerID,
			userID,
			newLocationID,
		)
		return didUpdate
	},
	getByID: async function (
		locationID: LocationID,
	): Promise<Location | undefined> {
		return await location.getByID(locationID)
	},
	getByCustomerID: async function getByCustomerID(
		customerID: CustomerID,
	): Promise<LocationWithCounts[]> {
		return await location.getAllByCustomerID(customerID)
	},
	getByName: async function (
		name: string,
		customerID: CustomerID,
	): Promise<Location | undefined> {
		return await location.getByName(name.trim(), customerID)
	},
	createWithAccess: async function (
		name: string,
		customerID: CustomerID,
		userIDs: number[],
	): Promise<boolean> {
		const transaction = await db.transaction(async trx => {
			const newLocationID = generateIdFromEntropySize(8)
			const newLocation = await location.create(
				{
					id: newLocationID,
					name: name.trim(),
					customerID: customerID,
				},
				trx,
			)
			if (!newLocation) return false

			const newDefaultPlacement = await inventory.createPlacement(
				{
					name: '-',
					locationID: newLocation.id,
				},
				trx,
			)

			const newBatch = await inventory.createBatch(
				{ batch: '-', locationID: newLocation.id },
				trx,
			)

			const products = await productService.getAllByCustomerID(customerID, trx)

			const productPromises = products.map(product => {
				const newInventoryData: NewInventory = {
					productID: product.id,
					placementID: newDefaultPlacement.id,
					batchID: newBatch.id,
					quantity: 0,
					customerID: customerID,
					locationID: newLocation.id,
				}

				return inventory.upsertInventory(newInventoryData, trx)
			})

			const userAccessPromises = userIDs.map(ID => {
				return location.createAccess(
					{
						userID: ID,
						customerID: customerID,
						locationID: newLocation.id,
					},
					trx,
				)
			})

			await Promise.allSettled([...productPromises, ...userAccessPromises])

			return true
		})

		return transaction
	},
	getAccessesByCustomerID: async function (
		customerID: CustomerID,
	): Promise<LocationAccessesWithName[]> {
		return await location.getAccessesByCustomerID(customerID)
	},
	getAccessesByLocationID: async function (
		locationID: LocationID,
	): Promise<LinkLocationToUser[]> {
		return await location.getAccessesByLocationID(locationID)
	},
	updateLocation: async function (
		locationID: LocationID,
		customerID: CustomerID,
		newName: string,
		oldAccesses: UserID[],
		newAccesses: UserID[],
		lang: string = fallbackLng,
	): Promise<boolean> {
		const { t } = await serverTranslation(lang, 'action-errors')
		const transaction = await db.transaction(async trx => {
			const didUpdateLocation = await location.updateLocation(
				locationID,
				{ name: newName },
				trx,
			)
			if (!didUpdateLocation) {
				throw new ActionError(
					t('location-service-action.location-didnt-update'),
				)
			}

			const usersToRemove = oldAccesses.filter(
				userID => !newAccesses.includes(userID),
			)
			const usersToAdd = newAccesses.filter(
				userID => !oldAccesses.includes(userID),
			)
			const usersToRemovePromises = usersToRemove.map(userID => {
				return location.removeAccess(
					{
						userID,
						locationID,
					},
					trx,
				)
			})
			const usersToAddPromises = usersToAdd.map(userID => {
				return location.createAccess(
					{
						userID,
						customerID,
						locationID,
					},
					trx,
				)
			})

			const accessReponses = await Promise.allSettled([
				...usersToRemovePromises,
				...usersToAddPromises,
			])

			for (const resp of accessReponses) {
				if (resp.status == 'rejected') {
					return false
				}
				if (resp.status == 'fulfilled' && resp.value == false) {
					return false
				}
			}

			return true
		})

		return transaction
	},
	updateStatus: async function (
		locationID: LocationID,
		isBarred: boolean,
	): Promise<boolean> {
		return await location.updateLocation(locationID, { isBarred: isBarred })
	},
	getAllActiveByUserID: async function (
		userID: UserID,
	): Promise<LocationWithPrimary[]> {
		return await location.getAllActiveByUserID(userID)
	},
	updateAccessByUserID: async function (
		userID: UserID,
		customerID: CustomerID,
		locationIDs: LocationID[],
	): Promise<boolean> {
		return await db.transaction(async trx => {
			const current = await location.getAllByUserID(userID, trx)

			const toRemove = current.filter(
				l => !locationIDs.some(lID => l.id == lID),
			)
			const toAdd = locationIDs.filter(lID => !current.some(l => l.id == lID))

			const primaryRemoved = toRemove.some(l => !l.isBarred && l.isPrimary)

			const removePromises = toRemove.map(
				async loc =>
					await location.removeAccess(
						{ locationID: loc.id, userID: userID },
						trx,
					),
			)

			const addPromises = toAdd.map(
				async loc =>
					await location.createAccess(
						{
							customerID: customerID,
							locationID: loc,
							userID: userID,
						},
						trx,
					),
			)

			const res = await Promise.all([...removePromises, ...addPromises])

			if (res.some(bool => !bool)) {
				trx.rollback()
				return false
			}

			if (primaryRemoved) {
				await location.toggleLocationPrimary(
					customerID,
					userID,
					locationIDs[0],
					trx,
				)
			}

			return true
		})
	},
}

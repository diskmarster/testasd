import { db, TRX } from '@/lib/database'
import { UserID, userTable } from '@/lib/database/schema/auth'
import {
	CustomerID,
	LinkLocationToUser,
	LinkLocationToUserPK,
	linkLocationToUserTable,
	Location,
	LocationID,
	locationTable,
	LocationWithPrimary,
	NewLinkLocationToUser,
	NewLocation,
	PartialLocation,
} from '@/lib/database/schema/customer'
import { and, eq, getTableColumns, not, sql } from 'drizzle-orm'
import { LocationAccessesWithName, LocationWithCounts } from './location.types'

export const location = {
	create: async function (
		locationData: NewLocation,
		trx: TRX = db,
	): Promise<Location | undefined> {
		const newLocation = await trx
			.insert(locationTable)
			.values(locationData)
			.returning()
		return newLocation[0]
	},
	getAllByCustomerID: async function (
		customerID: CustomerID,
		trx: TRX = db,
	): Promise<LocationWithCounts[]> {
		const locations = await trx
			.select({
				...getTableColumns(locationTable),
				modCount: sql<number>`sum(iif(${userTable.role} = 'moderator', 1, 0))`,
				userCount: sql<number>`sum(iif(${userTable.role} = 'bruger', 1, 0))`,
				outgoingCount: sql<number>`sum(iif(${userTable.role} = 'afgang', 1, 0))`,
				readCount: sql<number>`sum(iif(${userTable.role} = 'læseadgang', 1, 0))`,
			})
			.from(locationTable)
			.where(eq(locationTable.customerID, customerID))
			.leftJoin(
				linkLocationToUserTable,
				eq(linkLocationToUserTable.locationID, locationTable.id),
			)
			.leftJoin(userTable, eq(userTable.id, linkLocationToUserTable.userID))
			.groupBy(locationTable.id)

		return locations
	},
	getAllByUserID: async function (
		userID: UserID,
		trx: TRX = db,
	): Promise<LocationWithPrimary[]> {
		const locationCols = getTableColumns(locationTable)
		const locations = await trx
			.select({ ...locationCols, isPrimary: linkLocationToUserTable.isPrimary })
			.from(linkLocationToUserTable)
			.where(eq(linkLocationToUserTable.userID, userID))
			.innerJoin(
				locationTable,
				eq(locationTable.id, linkLocationToUserTable.locationID),
			)
		return locations
	},
	getByID: async function (
		locationID: LocationID,
		trx: TRX = db,
	): Promise<Location | undefined> {
		const location = await trx
			.select()
			.from(locationTable)
			.where(eq(locationTable.id, locationID))
		return location[0]
	},
	createAccess: async function (
		newLink: NewLinkLocationToUser,
		trx: TRX = db,
	): Promise<boolean> {
		const resultSet = await trx.insert(linkLocationToUserTable).values(newLink)
		return resultSet.rowsAffected == 1
	},
	getPrimary: async function (
		userID: UserID,
		trx: TRX = db,
	): Promise<Location | undefined> {
		const locationCols = getTableColumns(locationTable)
		const location = await trx
			.select({ ...locationCols })
			.from(linkLocationToUserTable)
			.where(
				and(
					eq(linkLocationToUserTable.userID, userID),
					eq(linkLocationToUserTable.isPrimary, true),
				),
			)
			.innerJoin(
				locationTable,
				eq(locationTable.id, linkLocationToUserTable.locationID),
			)
			.limit(1)
		return location[0]
	},
	toggleLocationPrimary: async function (
		customerID: CustomerID,
		userID: UserID,
		locationID: LocationID,
		trx: TRX = db,
	): Promise<boolean> {
		await trx
			.update(linkLocationToUserTable)
			.set({ isPrimary: false })
			.where(
				and(
					eq(linkLocationToUserTable.customerID, customerID),
					eq(linkLocationToUserTable.userID, userID),
				),
			)

		const result = await trx
			.insert(linkLocationToUserTable)
			.values({
				customerID,
				userID,
				locationID,
				isPrimary: true,
			})
			.onConflictDoUpdate({
				target: [
					linkLocationToUserTable.userID,
					linkLocationToUserTable.locationID,
				],
				set: { isPrimary: true },
			})

		return result.rowsAffected == 1
	},
	getByName: async function (
		name: string,
		customerID: CustomerID,
		trx: TRX = db,
	): Promise<Location | undefined> {
		const location = await trx
			.select()
			.from(locationTable)
			.where(
				and(
					eq(locationTable.name, name),
					eq(locationTable.customerID, customerID),
				),
			)
		return location[0]
	},
	getAccessesByCustomerID: async function (
		customerID: CustomerID,
		trx: TRX = db,
	): Promise<LocationAccessesWithName[]> {
		return await trx
			.select({
				...getTableColumns(linkLocationToUserTable),
				locationName: locationTable.name,
			})
			.from(linkLocationToUserTable)
			.innerJoin(
				locationTable,
				eq(locationTable.id, linkLocationToUserTable.locationID),
			)
			.where(eq(linkLocationToUserTable.customerID, customerID))
	},
	getAccessesByLocationID: async function (
		locationID: LocationID,
		trx: TRX = db,
	): Promise<LinkLocationToUser[]> {
		return await trx
			.select()
			.from(linkLocationToUserTable)
			.where(eq(linkLocationToUserTable.locationID, locationID))
	},
	updateLocation: async function (
		locationID: LocationID,
		locationData: PartialLocation,
		trx: TRX = db,
	): Promise<boolean> {
		const resultSet = await trx
			.update(locationTable)
			.set(locationData)
			.where(eq(locationTable.id, locationID))
		return resultSet.rowsAffected == 1
	},
	removeAccess: async function (
		linkPK: LinkLocationToUserPK,
		trx: TRX = db,
	): Promise<boolean> {
		const resultSet = await trx
			.delete(linkLocationToUserTable)
			.where(
				and(
					eq(linkLocationToUserTable.locationID, linkPK.locationID),
					eq(linkLocationToUserTable.userID, linkPK.userID),
				),
			)
		return resultSet.rowsAffected == 1
	},
	toggleStatus: async function (
		locationID: LocationID,
		trx: TRX = db,
	): Promise<boolean> {
		const resultSet = await trx
			.update(locationTable)
			.set({
				isBarred: not(locationTable.isBarred),
			})
			.where(eq(locationTable.id, locationID))
		return resultSet.rowsAffected == 1
	},
	getAllActiveByUserID: async function (
		userID: UserID,
		trx: TRX = db,
	): Promise<LocationWithPrimary[]> {
		const locationCols = getTableColumns(locationTable)
		const locations = await trx
			.select({ ...locationCols, isPrimary: linkLocationToUserTable.isPrimary })
			.from(linkLocationToUserTable)
			.where(
				and(
					eq(linkLocationToUserTable.userID, userID),
					eq(locationTable.isBarred, false),
				),
			)
			.innerJoin(
				locationTable,
				eq(locationTable.id, linkLocationToUserTable.locationID),
			)
		return locations
	},
}

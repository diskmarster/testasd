import { db, TRX } from '@/lib/database'
import { CustomerID } from '@/lib/database/schema/customer'
import {
	CustomerIntegration,
	CustomerIntegrationID,
	customerIntegrations,
	customerIntegrationSettings,
	CustomerIntegrationSettings,
	FullSyncCronConfig,
	FullSyncCronConfigID,
	fullSyncCronConfigs,
	IntegrationLog,
	integrationLogs,
	NewCustomerIntegration,
	NewCustomerIntegrationSettings,
	NewFullSyncCronConfig,
	NewIntegrationLog,
} from '@/lib/database/schema/integrations'
import { SyncProviderType } from '@/lib/integrations/sync/interfaces'
import { and, desc, eq, getTableColumns, SQLWrapper } from 'drizzle-orm'

const INTEGRATION_COLS = getTableColumns(customerIntegrations)
const SETTINGS_COLS = getTableColumns(customerIntegrationSettings)

export const integrations = {
	getCustomerIntegration: async function (
		id: CustomerIntegrationID,
		tx: TRX = db,
	): Promise<CustomerIntegration | undefined> {
		const result = await tx
			.select()
			.from(customerIntegrations)
			.where(eq(customerIntegrations.id, id))

		return result.at(0)
	},
	newCustomerIntegration: async function (
		data: NewCustomerIntegration,
		tx: TRX = db,
	): Promise<CustomerIntegration | undefined> {
		const result = await tx
			.insert(customerIntegrations)
			.values(data)
			.returning()
		return result.at(0)
	},
	getCustomerSettings: async function (
		customerID: CustomerID,
		tx: TRX = db,
	): Promise<CustomerIntegrationSettings | undefined> {
		const result = await tx
			.select()
			.from(customerIntegrationSettings)
			.where(eq(customerIntegrationSettings.customerID, customerID))
		return result.at(0)
	},
	newCustomerSettings: async function (
		data: NewCustomerIntegrationSettings,
		tx: TRX = db,
	): Promise<CustomerIntegrationSettings | undefined> {
		const result = await tx
			.insert(customerIntegrationSettings)
			.values(data)
			.returning()
		return result.at(0)
	},
	getProviders: async function (
		customerID: CustomerID,
		tx: TRX = db,
	): Promise<CustomerIntegration[]> {
		return await tx
			.select()
			.from(customerIntegrations)
			.where(eq(customerIntegrations.customerID, customerID))
	},
	getProviderByType: async function (
		customerID: CustomerID,
		provider: SyncProviderType,
		tx: TRX = db,
	): Promise<CustomerIntegration | undefined> {
		const result = await tx
			.select()
			.from(customerIntegrations)
			.where(
				and(
					eq(customerIntegrations.customerID, customerID),
					eq(customerIntegrations.provider, provider),
				),
			)
		return result.at(0)
	},
	deleteCustomerIntegration: async function (
		customerID: CustomerID,
		integrationID: number,
		tx: TRX = db,
	): Promise<boolean> {
		const result = await tx
			.delete(customerIntegrations)
			.where(
				and(
					eq(customerIntegrations.customerID, customerID),
					eq(customerIntegrations.id, integrationID),
				),
			)
		return result.rowsAffected == 1
	},
	updateSettings: async function (
		customerID: CustomerID,
		settings: Pick<CustomerIntegrationSettings, 'useSyncProducts'>,
		tx: TRX = db,
	) {
		const result = await tx
			.update(customerIntegrationSettings)
			.set({ ...settings })
			.where(eq(customerIntegrationSettings.customerID, customerID))
		return result.rowsAffected == 1
	},
	/**
	 * Fetches all [CustomerIntegrations] joined with [CustomerIntegrationSettings].
	 * If useSyncProducts is provided, this function will filter integrations by this flag.
	 * If customerID is provided, only integrations for this customer id is returned.
	 */
	getIntegrationsWithSettings: async function (
		customerID: CustomerID | undefined,
		useSyncProducts: boolean | undefined,
		tx: TRX = db,
	): Promise<(CustomerIntegration & CustomerIntegrationSettings)[]> {
		const whereClause: SQLWrapper[] = []
		if (customerID != undefined) {
			whereClause.push(eq(customerIntegrationSettings.customerID, customerID))
		}
		if (useSyncProducts != undefined) {
			whereClause.push(
				eq(customerIntegrationSettings.useSyncProducts, useSyncProducts),
			)
		}

		return await tx
			.select({
				...INTEGRATION_COLS,
				...SETTINGS_COLS,
			})
			.from(customerIntegrationSettings)
			.innerJoin(
				customerIntegrations,
				eq(customerIntegrationSettings.integrationID, customerIntegrations.id),
			)
			.where(and(...whereClause))
	},
	getFullSyncCronConfigs: async function (
		tx: TRX = db,
	): Promise<FullSyncCronConfig[]> {
		return await tx.select().from(fullSyncCronConfigs)
	},
	getFullSyncCronConfig: async function (
		[integrationID, customerID]: FullSyncCronConfigID,
		tx: TRX = db,
	): Promise<FullSyncCronConfig | undefined> {
		const res = await tx
			.select()
			.from(fullSyncCronConfigs)
			.where(
				and(
					eq(fullSyncCronConfigs.integrationID, integrationID),
					eq(fullSyncCronConfigs.customerID, customerID),
				),
			)

		return res.at(0)
	},
	createFullSyncCronConfig: async function (
		config: NewFullSyncCronConfig,
		tx: TRX = db,
	): Promise<FullSyncCronConfig | undefined> {
		const result = await tx
			.insert(fullSyncCronConfigs)
			.values(config)
			.returning()

		return result.at(0)
	},
	deleteFullSyncCronConfig: async function (
		[integrationID, customerID]: FullSyncCronConfigID,
		tx: TRX = db,
	): Promise<boolean> {
		const res = await tx
			.delete(fullSyncCronConfigs)
			.where(
				and(
					eq(fullSyncCronConfigs.integrationID, integrationID),
					eq(fullSyncCronConfigs.customerID, customerID),
				),
			)

		return res.rowsAffected == 1
	},
	getIntegrationLogs: async function (
		customerID: CustomerID,
		limit: number = 50,
		offset: number = 0,
		tx: TRX = db,
	): Promise<IntegrationLog[]> {
		return await tx
			.select()
			.from(integrationLogs)
			.where(eq(integrationLogs.customerID, customerID))
			.orderBy(desc(integrationLogs.inserted))
			.limit(limit)
			.offset(offset)
	},
	createIntegrationLog: async function (
		data: NewIntegrationLog,
		tx: TRX = db,
	): Promise<IntegrationLog | undefined> {
		const res = await tx.insert(integrationLogs).values(data).returning()

		return res.at(0)
	},
}

import { db, TRX } from '@/lib/database'
import { userTable } from '@/lib/database/schema/auth'
import {
  Customer,
  CustomerID,
  CustomerLink,
  CustomerLinkID,
  customerLinkTable,
  CustomerMailSetting,
  CustomerMailSettingID,
  customerMailSettingsTable,
  CustomerSettings,
  CustomerSettingsID,
  customerSettingsTable,
  customerTable,
  LocationID,
  locationTable,
  NewCustomer,
  NewCustomerLink,
  NewCustomerMailSetting,
  NewCustomerSettings,
  PartialCustomer,
  PartialCustomerSettings,
} from '@/lib/database/schema/customer'
import { and, count, desc, eq, getTableColumns, inArray, not } from 'drizzle-orm'
import {
  CustomerMailSettingWithEmail,
  CustomerWithUserCount,
} from './customer.types'

export const customer = {
  create: async function (
    newCustomer: NewCustomer,
    trx: TRX = db,
  ): Promise<Customer | undefined> {
    const customer = await trx
      .insert(customerTable)
      .values(newCustomer)
      .returning()
    return customer[0]
  },
  getByID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<Customer | undefined> {
    const customer = await trx
      .select()
      .from(customerTable)
      .where(eq(customerTable.id, customerID))
      .limit(1)
    return customer[0]
  },
  getByEmail: async function (
    customerEmail: string,
    trx: TRX = db,
  ): Promise<Customer | undefined> {
    const customer = await trx
      .select()
      .from(customerTable)
      .where(eq(customerTable.email, customerEmail))
      .limit(1)
    return customer[0]
  },
  createCustomerLink: async function (
    customerLinkData: NewCustomerLink,
    trx: TRX = db,
  ): Promise<CustomerLink | undefined> {
    const newCustomerLink = await trx
      .insert(customerLinkTable)
      .values(customerLinkData)
      .returning()
    return newCustomerLink[0]
  },
  deleteCustomerLink: async function (
    linkID: CustomerLinkID,
    trx: TRX = db,
  ): Promise<boolean> {
    const resultSet = await trx
      .delete(customerLinkTable)
      .where(eq(customerLinkTable.id, linkID))
    return resultSet.rowsAffected == 1
  },
  getCustomerLinkByID: async function (
    linkID: CustomerLinkID,
    trx: TRX = db,
  ): Promise<CustomerLink | undefined> {
    const customerLink = await trx
      .select()
      .from(customerLinkTable)
      .where(eq(customerLinkTable.id, linkID))
      .limit(1)
    return customerLink[0]
  },
  toggleActivationStatusByID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<boolean> {
    const resultSet = await trx
      .update(customerTable)
      .set({ isActive: not(customerTable.isActive) })
      .where(eq(customerTable.id, customerID))
    return resultSet.rowsAffected == 1
  },
  updateByID: async function(customerID: CustomerID, customerData: PartialCustomer, trx: TRX =db): Promise<boolean> {
    const resultSet = await trx.update(customerTable).set(customerData).where(eq(customerTable.id, customerID))
    return resultSet.rowsAffected == 1
  },
  getAll: async function(trx: TRX = db): Promise<CustomerWithUserCount[]> {
    return trx
      .select({
        ...getTableColumns(customerTable),
        userCount: count(userTable.id)
      })
      .from(customerTable)
      .leftJoin(userTable, eq(userTable.customerID, customerTable.id))
      .groupBy(customerTable.id)
  },
  deleteByID: async function(customerID: CustomerID, trx: TRX = db): Promise<boolean> {
    const res = await trx.delete(customerTable).where(eq(customerTable.id, customerID))
    return res.rowsAffected == 1
  },
  getSettings: async function(customerID: CustomerID, trx: TRX = db): Promise<CustomerSettings | undefined> {
    const [res] = await trx
      .select()
      .from(customerSettingsTable)
      .where(eq(customerSettingsTable.customerID, customerID))

    return res
  },
  createSettings: async function(data: NewCustomerSettings, trx: TRX = db): Promise<CustomerSettings | undefined> {
    const [res] = await trx
      .insert(customerSettingsTable)
      .values(data)
      .returning()

    return res
  },
  updateSettings: async function(id: CustomerSettingsID, data: PartialCustomerSettings, trx: TRX = db): Promise<CustomerSettings | undefined> {
    const [res] = await trx
      .update(customerSettingsTable)
      .set({
        ...data
      })
      .where(eq(customerSettingsTable.id, id))
      .returning()

    return res
  },
  createMailSetting: async function (
    data: NewCustomerMailSetting,
    tx: TRX = db,
  ): Promise<CustomerMailSetting | undefined> {
    const [res] = await tx
      .insert(customerMailSettingsTable)
      .values(data)
      .returning()
    return res
  },
  getAllMailSettings: async function (
    customerID: CustomerID,
    tx: TRX = db,
  ): Promise<CustomerMailSettingWithEmail[]> {
    return await tx
      .select({
        ...getTableColumns(customerMailSettingsTable),
        userEmail: userTable.email,
				locationName: locationTable.name,
      })
      .from(customerMailSettingsTable)
      .where(eq(customerMailSettingsTable.customerID, customerID))
			.orderBy(customerMailSettingsTable.locationID, desc(customerMailSettingsTable.id))
			.innerJoin(locationTable, eq(locationTable.id, customerMailSettingsTable.locationID))
      .leftJoin(userTable, eq(userTable.id, customerMailSettingsTable.userID))
  },
  getAccessibleMailSettings: async function (
    customerID: CustomerID,
		locationIDs: LocationID[],
    tx: TRX = db,
  ): Promise<CustomerMailSettingWithEmail[]> {
    return await tx
      .select({
        ...getTableColumns(customerMailSettingsTable),
        userEmail: userTable.email,
				locationName: locationTable.name,
      })
      .from(customerMailSettingsTable)
      .where(
				and(
					eq(customerMailSettingsTable.customerID, customerID),
					inArray(customerMailSettingsTable.locationID, locationIDs)
				)
			)
			.orderBy(customerMailSettingsTable.locationID, desc(customerMailSettingsTable.id))
			.innerJoin(locationTable, eq(locationTable.id, customerMailSettingsTable.locationID))
      .leftJoin(userTable, eq(userTable.id, customerMailSettingsTable.userID))
  },
  deleteMailSetting: async function (
    mailSettingID: CustomerMailSettingID,
    tx: TRX = db,
  ): Promise<boolean> {
    const res = await tx
      .delete(customerMailSettingsTable)
      .where(eq(customerMailSettingsTable.id, mailSettingID))
    return res.rowsAffected == 1
  },
  getMailSettingsForCron: async function (
		mailType?: keyof Pick<CustomerMailSetting, 'sendStockMail' | 'sendMovementsMail'>,
    tx: TRX = db,
  ): Promise<CustomerMailSettingWithEmail[]> {
			const cols = getTableColumns(customerMailSettingsTable)
			const typeCol = mailType ? cols[mailType] : undefined
    return await tx
      .select({
        ...getTableColumns(customerMailSettingsTable),
        userEmail: userTable.email,
				locationName: locationTable.name,
      })
      .from(customerMailSettingsTable)
			.where(
				typeCol ? eq(typeCol, true) : undefined
			)
			.orderBy(customerMailSettingsTable.locationID, desc(customerMailSettingsTable.id))
			.innerJoin(locationTable, eq(locationTable.id, customerMailSettingsTable.locationID))
      .leftJoin(userTable, eq(userTable.id, customerMailSettingsTable.userID))
  },
  updateMailSetting: async function(id: CustomerMailSettingID, data: Partial<CustomerMailSettingWithEmail>, trx: TRX = db): Promise<CustomerMailSetting | undefined> {
    const [res] = await trx
      .update(customerMailSettingsTable)
      .set({
        ...data
      })
      .where(eq(customerMailSettingsTable.id, id))
      .returning()

    return res
  },
  getMailSettingsForIDs: async function(
    customerID: CustomerID,
    locationID: LocationID,
		mailType: keyof Pick<CustomerMailSetting, 'sendStockMail' | 'sendReorderMail'>,
    tx: TRX = db,
  ): Promise<CustomerMailSettingWithEmail[]> {
    const typeCol = getTableColumns(customerMailSettingsTable)[mailType]
    return await tx
      .select({
        ...getTableColumns(customerMailSettingsTable),
        userEmail: userTable.email,
				locationName: locationTable.name,
      })
      .from(customerMailSettingsTable)
      .where(
				and(
					eq(customerMailSettingsTable.customerID, customerID),
					eq(customerMailSettingsTable.locationID, locationID),
          eq(typeCol, true),
				)
			)
			.orderBy(customerMailSettingsTable.locationID, desc(customerMailSettingsTable.id))
			.innerJoin(locationTable, eq(locationTable.id, customerMailSettingsTable.locationID))
      .leftJoin(userTable, eq(userTable.id, customerMailSettingsTable.userID))
  },
  getExtraMailInfo: async function(
    settingID: CustomerMailSettingID,
    tx: TRX = db,
  ): Promise<{
    userEmail: string | null
    locationName: string
  } | undefined> {
    const [res] = await tx
      .select({
        userEmail: userTable.email,
        locationName: locationTable.name,
      })
      .from(customerMailSettingsTable)
      .where(eq(customerMailSettingsTable.id, settingID))
			.innerJoin(locationTable, eq(locationTable.id, customerMailSettingsTable.locationID))
      .leftJoin(userTable, eq(userTable.id, customerMailSettingsTable.userID))

    return res
  }
}

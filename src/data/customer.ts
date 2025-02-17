import { db, TRX } from '@/lib/database'
import { userTable } from '@/lib/database/schema/auth'
import {
  Customer,
  CustomerID,
  CustomerLink,
  CustomerLinkID,
  customerLinkTable,
  CustomerSettings,
  customerSettingsTable,
  customerTable,
  NewCustomer,
  NewCustomerLink,
  PartialCustomer,
} from '@/lib/database/schema/customer'
import { count, eq, getTableColumns, not } from 'drizzle-orm'
import { CustomerWithUserCount } from './customer.types'

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
}

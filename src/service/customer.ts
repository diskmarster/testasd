import { fallbackLng } from '@/app/i18n/settings'
import { customer } from '@/data/customer'
import { CustomerWithUserCount } from '@/data/customer.types'
import { user } from '@/data/user'
import { UserLinkID } from '@/lib/database/schema/auth'
import {
  Customer,
  CustomerID,
  CustomerLink,
  CustomerLinkID,
  CustomerSettings,
  CustomerSettingsID,
  NewCustomer,
  NewCustomerLink,
  NewCustomerSettings,
  PartialCustomer,
  PartialCustomerSettings,
} from '@/lib/database/schema/customer'
import { generateIdFromEntropySize } from 'lucia'
import { isLinkExpired } from './customer.utils'
import { db } from '@/lib/database'

const ACTIVATION_LINK_BASEURL =
  process.env.VERCEL_ENV === 'production'
    ? 'https://lager.nemunivers.app'
    : process.env.VERCEL_ENV === 'preview'
      ? 'stage.lager.nemunivers.app'
      : 'http://localhost:3000'
export type CustomerActivationLink =
  `${typeof ACTIVATION_LINK_BASEURL}/${string}/registrer/${CustomerLinkID}`
const LINK_DURATION_HOURS = 24

export const customerService = {
  create: async function (
    customerData: NewCustomer,
  ): Promise<Customer | undefined> {
    return db.transaction(async (trx) => {
      const newCustomer = await customer.create(customerData, trx)

      if (newCustomer == undefined) {
        return undefined
      }

      const settings = await customer.createSettings({customerID: newCustomer?.id}, trx)
      if (settings == undefined) {
        trx.rollback()
        return undefined
      }

      return newCustomer
    })
  },
  getByEmail: async function (email: string): Promise<Customer | undefined> {
    const existingCustomer = await customer.getByEmail(email)
    return existingCustomer
  },
  getByID: async function (
    customerID: CustomerID,
  ): Promise<Customer | undefined> {
    const existingCustomer = await customer.getByID(customerID)
    return existingCustomer
  },
  createActivationLink: async function (
    customerLinkData: Omit<NewCustomerLink, 'id'>,
  ): Promise<CustomerActivationLink | undefined> {
    const id = generateIdFromEntropySize(16)
    const newCustomerLink = await customer.createCustomerLink({
      ...customerLinkData,
      id: id,
    })
    if (!newCustomerLink) return undefined
    return `${ACTIVATION_LINK_BASEURL}/${fallbackLng}/registrer/${newCustomerLink.id}`
  },
  getActivationLinkByID: async function (
    linkID: CustomerLinkID,
  ): Promise<CustomerLink | undefined> {
    const existingCustomerLink = await customer.getCustomerLinkByID(linkID)
    return existingCustomerLink
  },
  validateActivationLink: function (insertedDate: Date): boolean {
    return isLinkExpired(insertedDate, LINK_DURATION_HOURS)
  },
  deleteActivationLink: async function (
    linkID: CustomerLinkID,
  ): Promise<boolean> {
    return await customer.deleteCustomerLink(linkID)
  },
  getByLinkID: async function (
    linkID: CustomerLinkID,
  ): Promise<Customer | undefined> {
    const existingLink = await customer.getCustomerLinkByID(linkID)
    if (!existingLink) return undefined
    const existingCustomer = customer.getByID(existingLink.customerID)
    return existingCustomer
  },
  getByUserLinkID: async function (
    linkID: UserLinkID,
  ): Promise<Customer | undefined> {
    const existingLink = await user.getUserLinkByID(linkID)
    if (!existingLink) return undefined
    const existingCustomer = customer.getByID(existingLink.customerID)
    return existingCustomer
  },
  toggleActivationByID: async function (
    customerID: CustomerID,
  ): Promise<boolean> {
    return await customer.toggleActivationStatusByID(customerID)
  },
  updateByID: async function (
    customerID: CustomerID,
    customerData: PartialCustomer,
  ): Promise<boolean> {
    return await customer.updateByID(customerID, customerData)
  },
  getAll: async function (): Promise<CustomerWithUserCount[]> {
    return customer.getAll()
  },
  deleteByID: async function(customerID: CustomerID): Promise<boolean> {
    return customer.deleteByID(customerID)
  },
  getSettings: async function(customerID: CustomerID): Promise<CustomerSettings | undefined> {
    return await customer.getSettings(customerID)
  },
  createSettings: async function(data: NewCustomerSettings): Promise<CustomerSettings | undefined> {
    return await customer.createSettings(data)
  },
  updateSettings: async function(id: CustomerSettingsID, data: PartialCustomerSettings): Promise<CustomerSettings | undefined> {
    if (data.id != undefined) {
      delete data.id
    }
    if (data.customerID != undefined) {
      delete data.customerID
    }

    return customer.updateSettings(id, data)
  }
}

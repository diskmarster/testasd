import { customer } from "@/data/customer";
import { Customer, CustomerID, CustomerLink, CustomerLinkID, NewCustomer, NewCustomerLink } from "@/lib/database/schema/customer";
import { generateIdFromEntropySize } from "lucia";
import { isLinkExpired } from "./customer.utils";

const ACTIVATION_LINK_BASEURL = process.env.VERCEL_ENV === 'production' ? 'https://lager.nemunivers.app' : process.env.VERCEL_ENV === 'preview' ? 'stage-lager.nemunivers.app' : 'http://localhost:3000'
export type CustomerActivationLink = `${typeof ACTIVATION_LINK_BASEURL}/registrer/${CustomerLinkID}`
const LINK_DURATION_HOURS = 1

export const customerService = {
  create: async function(customerData: NewCustomer): Promise<Customer | undefined> {
    const newCustomer = await customer.create(customerData)
    return newCustomer
  },
  getByEmail: async function(email: string): Promise<Customer | undefined> {
    const existingCustomer = await customer.getByEmail(email)
    return existingCustomer
  },
  getByID: async function(customerID: CustomerID): Promise<Customer | undefined> {
    const existingCustomer = await customer.getByID(customerID)
    return existingCustomer
  },
  createActivationLink: async function(customerLinkData: NewCustomerLink): Promise<CustomerActivationLink | undefined> {
    const id = generateIdFromEntropySize(16)
    const newCustomerLink = await customer.createCustomerLink({ ...customerLinkData, id: id })
    if (!newCustomerLink) return undefined
    return `${ACTIVATION_LINK_BASEURL}/registrer/${newCustomerLink.id}`
  },
  getActivationLinkByID: async function(linkID: CustomerLinkID): Promise<CustomerLink | undefined> {
    const existingCustomerLink = await customer.getCustomerLinkByID(linkID)
    return existingCustomerLink
  },
  validateActivationLink: function(insertedDate: Date): boolean {
    return isLinkExpired(insertedDate, LINK_DURATION_HOURS)
  },
  deleteActivationLink: async function(linkID: CustomerLinkID): Promise<boolean> {
    return await customer.deleteCustomerLink(linkID)
  },
  getByLinkID: async function(linkID: CustomerLinkID): Promise<Customer | undefined> {
    const existingLink = await customer.getCustomerLinkByID(linkID)
    if (!existingLink) return undefined
    const existingCustomer = customer.getByID(existingLink.customerID)
    return existingCustomer
  },
  toggleActivationByID: async function(customerID: CustomerID): Promise<boolean> {
    return await customer.toggleActivationStatusByID(customerID)
  }
}

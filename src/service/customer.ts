import { customer } from "@/data/customer";
import { Customer, NewCustomer, NewCustomerLink } from "@/lib/database/schema/customer";

const ACTIVATION_LINK_BASEURL = process.env.VERCEL_ENV === 'production' ? 'https://lager.nemunivers.app' : process.env.VERCEL_ENV === 'preview' ? 'stage-lager.nemunivers.app' : 'http://localhost:3000'
export type CustomerActivationLink = `${typeof ACTIVATION_LINK_BASEURL}/registrer/${number}`

export const customerService = {
  create: async function(customerData: NewCustomer): Promise<Customer | undefined> {
    const newCustomer = await customer.create(customerData)
    if (!newCustomer) return undefined
    return newCustomer
  },
  getByEmail: async function(email: string): Promise<Customer | undefined> {
    const existingCustomer = await customer.getByEmail(email)
    if (!existingCustomer) return undefined
    return existingCustomer
  },
  createActivationLink: async function(customerLinkData: NewCustomerLink): Promise<CustomerActivationLink | undefined> {
    const newCustomerLink = await customer.createCustomerLink(customerLinkData)
    if (!newCustomerLink) return undefined
    return `${ACTIVATION_LINK_BASEURL}/registrer/${newCustomerLink.id}`
  },
  getByLinkID: async function(linkID: number): Promise<Customer | undefined> {
    const existingLink = await customer.getCustomerLinkByID(linkID)
    if (!existingLink) return undefined
    const existingCustomer = customer.getByID(existingLink.customerID)
    if (!existingCustomer) return undefined
    return existingCustomer
  }
}

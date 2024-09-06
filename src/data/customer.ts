import { db } from "@/lib/database";
import { Customer, CustomerID, CustomerLink, CustomerLinkID, customerLinkTable, customerTable, NewCustomer, NewCustomerLink } from "@/lib/database/schema/customer";
import { eq, not } from "drizzle-orm";

export const customer = {
  create: async function(newCustomer: NewCustomer): Promise<Customer | undefined> {
    const customer = await db.insert(customerTable).values(newCustomer).returning()
    return customer[0]
  },
  getByID: async function(customerID: CustomerID): Promise<Customer | undefined> {
    const customer = await db.select().from(customerTable).where(eq(customerTable.id, customerID)).limit(1)
    return customer[0]
  },
  getByEmail: async function(customerEmail: string): Promise<Customer | undefined> {
    const customer = await db.select().from(customerTable).where(eq(customerTable.email, customerEmail)).limit(1)
    return customer[0]
  },
  createCustomerLink: async function(customerLinkData: NewCustomerLink): Promise<CustomerLink | undefined> {
    const newCustomerLink = await db.insert(customerLinkTable).values(customerLinkData).returning()
    return newCustomerLink[0]
  },
  deleteCustomerLink: async function(linkID: CustomerLinkID): Promise<boolean> {
    const resultSet = await db.delete(customerLinkTable).where(eq(customerLinkTable.id, linkID))
    return resultSet.rowsAffected == 1
  },
  getCustomerLinkByID: async function(linkID: CustomerLinkID): Promise<CustomerLink | undefined> {
    const customerLink = await db.select().from(customerLinkTable).where(eq(customerLinkTable.id, linkID)).limit(1)
    return customerLink[0]
  },
  toggleActivationStatusByID: async function(customerID: CustomerID): Promise<boolean> {
    const resultSet = await db.update(customerTable).set({ isActive: not(customerTable.isActive) }).where(eq(customerTable.id, customerID))
    return resultSet.rowsAffected == 1
  }
}

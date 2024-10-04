import { db, TRX } from "@/lib/database";
import { NewUser, NewUserLink, PartialUser, User, UserID, UserLink, UserLinkID, userLinkTable, userTable } from "@/lib/database/schema/auth";
import { CustomerID } from "@/lib/database/schema/customer";
import { eq } from "drizzle-orm";

export const user = {
  create: async function(
    newUser: NewUser,
    trx: TRX = db,
  ): Promise<User | undefined> {
    const user = await trx.insert(userTable).values(newUser).returning()
    return user[0]
  },
  getByID: async function(
    userID: UserID,
    trx: TRX = db,
  ): Promise<User | undefined> {
    const user = await trx
      .select()
      .from(userTable)
      .where(eq(userTable.id, userID))
      .limit(1)
    return user[0]
  },
  getByEmail: async function(
    userEmail: string,
    trx: TRX = db,
  ): Promise<User | undefined> {
    const user = await trx
      .select()
      .from(userTable)
      .where(eq(userTable.email, userEmail))
      .limit(1)
    return user[0]
  },
  updateByID: async function(
    userID: UserID,
    updatedUser: PartialUser,
    trx: TRX = db,
  ): Promise<User | undefined> {
    const user = await trx
      .update(userTable)
      .set({ ...updatedUser })
      .where(eq(userTable.id, userID))
      .returning()
    return user[0]
  },
  deleteByID: async function(userID: UserID, trx: TRX = db): Promise<boolean> {
    const resultSet = await trx
      .delete(userTable)
      .where(eq(userTable.id, userID))
    return resultSet.rowsAffected == 1
  },
  getAllByCustomerID: async function(customerID:CustomerID, trx: TRX = db): Promise<User[]> {
    return await trx.select().from(userTable).where(eq(userTable.customerID,customerID))
  },
  createUserLink: async function(linkData: NewUserLink, trx: TRX = db): Promise<UserLink | undefined> {
    const userLinks = await trx.insert(userLinkTable).values(linkData).returning()
    return userLinks[0]
  },
  getUserLinkByID: async function(userLinkID: UserLinkID, trx: TRX = db): Promise<UserLink> {
    const userLink = await trx.select().from(userLinkTable).where(eq(userLinkTable.id, userLinkID))
    return userLink[0]
  },
  deleteUserLink: async function(linkID: UserLinkID, trx: TRX = db): Promise<boolean> {
    const resultSet = await trx.delete(userLinkTable).where(eq(userLinkTable.id, linkID))
    return resultSet.rowsAffected == 1
  },
}

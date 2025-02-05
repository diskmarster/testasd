import {
  AuthProviderDomain,
  inList,
  UserNoHashWithCompany,
  UserRole,
} from '@/data/user.types'
import { db, TRX } from '@/lib/database'
import {
  AuthProvider,
  AuthProviderID,
  authProviderTable,
  GenericAuthProvider,
  NewAuthProvider,
  NewUser,
  NewUserLink,
  PartialUser,
  User,
  UserID,
  UserLink,
  UserLinkID,
  userLinkTable,
  userTable,
} from '@/lib/database/schema/auth'
import { CustomerID, customerTable } from '@/lib/database/schema/customer'
import { and, eq, getTableColumns, not, sql } from 'drizzle-orm'

export const user = {
  create: async function (
    newUser: NewUser,
    trx: TRX = db,
  ): Promise<User | undefined> {
    const user = await trx.insert(userTable).values(newUser).returning()
    return user[0]
  },
  getByID: async function (
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
  getByEmail: async function (
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
  updateByID: async function (
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
  deleteByID: async function (userID: UserID, trx: TRX = db): Promise<boolean> {
    const resultSet = await trx
      .delete(userTable)
      .where(eq(userTable.id, userID))
    return resultSet.rowsAffected == 1
  },
  getAllByCustomerID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<User[]> {
    return await trx
      .select()
      .from(userTable)
      .where(eq(userTable.customerID, customerID))
  },
  createUserLink: async function (
    linkData: NewUserLink,
    trx: TRX = db,
  ): Promise<UserLink | undefined> {
    const userLinks = await trx
      .insert(userLinkTable)
      .values(linkData)
      .onConflictDoUpdate({
        target: userLinkTable.email,
        set: { inserted: linkData.inserted ?? new Date() },
      })
      .returning()
    return userLinks[0]
  },
  getUserLinkByID: async function (
    userLinkID: UserLinkID,
    trx: TRX = db,
  ): Promise<UserLink> {
    const userLink = await trx
      .select()
      .from(userLinkTable)
      .where(eq(userLinkTable.id, userLinkID))
    return userLink[0]
  },
  deleteUserLink: async function (
    linkID: UserLinkID,
    trx: TRX = db,
  ): Promise<boolean> {
    const resultSet = await trx
      .delete(userLinkTable)
      .where(eq(userLinkTable.id, linkID))
    return resultSet.rowsAffected == 1
  },
  toggleStatus: async function (
    userID: UserID,
    trx: TRX = db,
  ): Promise<boolean> {
    const resultSet = await trx
      .update(userTable)
      .set({
        isActive: not(userTable.isActive),
      })
      .where(eq(userTable.id, userID))
    return resultSet.rowsAffected == 1
  },
  getByIDs: async function (userIDs: UserID[], trx: TRX = db): Promise<User[]> {
    return trx.select().from(userTable).where(inList(userTable.id, userIDs))
  },
  getAuthProviderByDomain: async function <TDomain extends AuthProviderDomain>(
    userID: UserID,
    domain: TDomain,
    trx: TRX = db,
  ): Promise<GenericAuthProvider<TDomain> | undefined> {
    const [res] = await trx
      .select()
      .from(authProviderTable)
      .where(
        and(
          eq(authProviderTable.userID, userID),
          eq(authProviderTable.domain, domain),
        ),
      )

    if (!authProviderIsDomain(res, domain)) {
      return undefined
    }

    return res
  },
  updateAuthProvider: async function <TDomain extends AuthProviderDomain>(
    userID: UserID,
    domain: TDomain,
    authID: AuthProvider['authID'],
    trx: TRX = db,
  ): Promise<GenericAuthProvider<TDomain> | undefined> {
    const [res] = await trx
      .update(authProviderTable)
      .set({ authID: authID })
      .where(
        and(
          eq(authProviderTable.userID, userID),
          eq(authProviderTable.domain, domain),
        ),
      )
      .returning()

    if (!authProviderIsDomain(res, domain)) {
      return undefined
    }

    return res
  },
  createAuthProvider: async function (
    ap: NewAuthProvider,
    trx: TRX = db,
  ): Promise<AuthProvider | undefined> {
    const [res] = await trx.insert(authProviderTable).values(ap).returning()

    return res
  },
  deleteAuthProvider: async function (
    id: AuthProviderID,
    trx: TRX = db,
  ): Promise<boolean> {
    const res = await trx
      .delete(authProviderTable)
      .where(eq(authProviderTable.id, id))

    return res.rowsAffected > 0
  },
  getAllInfoByCustomerID: async function (
    customerID: CustomerID,
    trx: TRX = db,
  ): Promise<(User & { nfcProvider: AuthProvider | null })[]> {
    const userCols = getTableColumns(userTable)
    const providerCols = getTableColumns(authProviderTable)
    return await trx
      .select({
        ...userCols,
        nfcProvider: {
          ...providerCols,
        },
      })
      .from(userTable)
      .leftJoin(
        authProviderTable,
        and(
          eq(userTable.id, authProviderTable.userID),
          eq(authProviderTable.domain, 'nfc'),
        ),
      )
      .where(eq(userTable.customerID, customerID))
  },
  getUserInfoByUserID: async function (
    userID: UserID,
    trx: TRX = db,
  ): Promise<(User & { nfcProvider: AuthProvider | null }) | undefined> {
    const userCols = getTableColumns(userTable)
    const providerCols = getTableColumns(authProviderTable)
    const [res] = await trx
      .select({
        ...userCols,
        nfcProvider: {
          ...providerCols,
        },
      })
      .from(userTable)
      .leftJoin(
        authProviderTable,
        and(
          eq(userTable.id, authProviderTable.userID),
          eq(authProviderTable.domain, 'nfc'),
        ),
      )
      .where(eq(userTable.id, userID))

    return res
  },
  /**
   * uses the authID and domain to find a matching authprovider, if any
   * and joins with usertable, to include the corresponding user in the response
   */
  getAuthProviderWithUser: async function <TDomain extends AuthProviderDomain>(
    authID: string,
    domain: TDomain,
    trx: TRX = db,
  ): Promise<(GenericAuthProvider<TDomain> & { user: User }) | undefined> {
    const userCols = getTableColumns(userTable)
    const providerCols = getTableColumns(authProviderTable)

    const [res] = await trx
      .select({
        ...providerCols,
        user: {
          ...userCols,
        },
      })
      .from(authProviderTable)
      .innerJoin(userTable, eq(authProviderTable.userID, userTable.id))
      .where(
        and(
          eq(authProviderTable.authID, authID),
          eq(authProviderTable.domain, domain),
        ),
      )

    if (!authProviderIsDomain(res, domain)) {
      return undefined
    }

    return res
  },
  getAllAndInvites: async function (
    trx: TRX = db,
  ): Promise<UserNoHashWithCompany[]> {
    const customers = await trx.select().from(customerTable)

    const users = await trx
      .select({
        id: sql<number | null>`coalesce(${userTable.id}, ${userLinkTable.id})`,
        customerID: sql<number>`coalesce(${userTable.customerID}, ${userLinkTable.customerID})`,
        name: sql<string>`coalesce(${userTable.name}, '-')`,
        email: sql<string>`coalesce(${userTable.email}, ${userLinkTable.email})`,
        role: sql<UserRole>`coalesce(${userTable.role}, ${userLinkTable.role})`,
        isActive: sql<boolean | null>`coalesce(${userTable.isActive}, '-')`,
        inserted: sql<number>`coalesce(${userTable.inserted}, ${userLinkTable.inserted})`,
        updated: sql<number | '-'>`coalesce(${userTable.updated}, '-')`,
        appAccess: sql<boolean>`coalesce(${userTable.appAccess}, ${userLinkTable.appAccess})`,
        webAccess: sql<boolean>`coalesce(${userTable.webAccess}, ${userLinkTable.webAccess})`,
        priceAccess: sql<boolean>`coalesce(${userTable.priceAccess}, ${userLinkTable.priceAccess})`,
      })
      .from(userTable)
      .fullJoin(userLinkTable, eq(userTable.email, userLinkTable.email))

    return users.map(u => ({
      ...u,
      company: customers.find(c => c.id == u.customerID)?.company ?? 'Ukendt',
    }))
  },
  deleteUserLinkByEmail: async function (
    email: string,
    trx: TRX = db,
  ): Promise<boolean> {
    const resultSet = await trx
      .delete(userLinkTable)
      .where(eq(userLinkTable.email, email))
    return resultSet.rowsAffected == 1
  },
}

export function authProviderIsDomain<TDomain extends AuthProviderDomain>(
  ap: AuthProvider | undefined,
  domain: TDomain,
): ap is GenericAuthProvider<TDomain> {
  return ap != undefined && ap.domain == domain
}

import { authProviderIsDomain, user } from '@/data/user'
import {
  NewUser,
  NewUserLink,
  NfcAuthProvider,
  PartialUser,
  UserID,
  UserLink,
  UserLinkID,
  UserNoHash,
} from '@/lib/database/schema/auth'
import { hashPassword, userDTO, verifyPassword } from './user.utils'
import { CustomerID } from '@/lib/database/schema/customer'
import { db } from '@/lib/database'
import { location } from '@/data/location'
import { generateIdFromEntropySize } from 'lucia'
import { isLinkExpired } from './customer.utils'
import { UserInfo } from '@/data/user.types'
import { UserNoHashWithCompany } from '@/data/user.types'

const ACTIVATION_LINK_BASEURL = process.env.VERCEL_ENV === 'production' ? 'https://lager.nemunivers.app' : process.env.VERCEL_ENV === 'preview' ? 'stage.lager.nemunivers.app' : 'http://localhost:3000'
export type UserActivationLink = `${typeof ACTIVATION_LINK_BASEURL}/invitering/${UserLinkID}`
const LINK_DURATION_HOURS = 8

export const userService = {
  register: async function(
    userData: NewUser,
  ): Promise<UserNoHash | undefined> {
    const hashed = await hashPassword(userData.hash)
    userData.hash = hashed
    const hashedPin = await hashPassword(userData.pin)
    userData.pin = hashedPin
    return await db.transaction(async trx => {
      const newUser = await user.create(userData, trx)
      if (!newUser) return undefined
      const pwAuth = await user.createAuthProvider({
        userID: newUser.id,
        authID: hashed,
        domain: 'pw',
      }, trx)
      const pinAuth = await user.createAuthProvider({
        userID: newUser.id,
        authID: hashedPin,
        domain: 'pin',
      }, trx)
      if (!pwAuth || !pinAuth) {
        trx.rollback()
        return undefined
      }

      return userDTO(newUser)
    })
  },
  verifyPassword: async function(
    email: string,
    password: string,
  ): Promise<UserNoHash | undefined> {
    const existingUser = await user.getByEmail(email)
    if (!existingUser) return undefined
    const auth = await user.getAuthProviderByDomain(existingUser.id, 'pw')
    if (!auth) return undefined
    const isValid = await verifyPassword(auth.authID, password)
    if (!isValid) return undefined
    return userDTO(existingUser)
  },
  verifyPin: async function(
    email: string,
    pin: string,
  ): Promise<UserNoHash | undefined> {
    const existingUser = await user.getByEmail(email)
    if (!existingUser) {
      return undefined
    }
    const auth = await user.getAuthProviderByDomain(existingUser.id, 'pin')
    if (!auth) return undefined
    const isValidPin = await verifyPassword(auth.authID, pin)
    if (!isValidPin) {
      return undefined
    }
    return userDTO(existingUser)
  },
  getByID: async function(userID: UserID): Promise<UserNoHash | undefined> {
    const existingUser = await user.getByID(userID)
    if (!existingUser) return undefined
    return userDTO(existingUser)
  },
  getByEmail: async function(
    userEmail: string,
  ): Promise<UserNoHash | undefined> {
    const existingUser = await user.getByEmail(userEmail)
    if (!existingUser) return undefined
    return userDTO(existingUser)
  },
  updateByID: async function(
    userID: UserID,
    updatedData: PartialUser,
  ): Promise<UserNoHash | undefined> {
    const updatedUser = await user.updateByID(userID, updatedData)
    if (!updatedUser) return undefined
    return userDTO(updatedUser)
  },
  updatePassword: async function(
    userID: UserID,
    newPassword: string,
  ): Promise<UserNoHash | undefined> {
    const hashedPassword = await hashPassword(newPassword)
    const updatedAuth = await user.updateAuthProvider(userID, 'pw', hashedPassword)
    if (!updatedAuth) return undefined
    return await user.getByID(userID)
  },

  updatePin: async function(
    userID: UserID,
    newPin: string,
  ): Promise<UserNoHash | undefined> {
    const hashedPin = await hashPassword(newPin)
    const updatedAuth = await user.updateAuthProvider(userID, 'pin', hashedPin)
    if (!updatedAuth) return undefined
    return await user.getByID(userID)
  },

  deleteByID: async function(userID: UserID): Promise<boolean> {
    return user.deleteByID(userID)
  },
  getAllByCustomerID: async function(customerID: CustomerID): Promise<UserNoHash[]> {
    const users = await user.getAllByCustomerID(customerID)
    return users.map(u => userDTO(u))
  },
  createInvitedUser: async function(userLinkData: UserLink, newUserData: NewUser): Promise<UserNoHash | undefined> {
    const transaction = await db.transaction(async trx => {
      const hashed = await hashPassword(newUserData.hash)
      newUserData.hash = hashed
      const hashedPin = await hashPassword(newUserData.pin)
      newUserData.pin = hashedPin
      const newUser = await user.create(newUserData, trx)
      if (!newUser) return undefined
      const pwAuth = await user.createAuthProvider({
        userID: newUser.id,
        authID: hashed,
        domain: 'pw',
      }, trx)
      const pinAuth = await user.createAuthProvider({
        userID: newUser.id,
        authID: hashedPin,
        domain: 'pin',
      }, trx)
      if (!pwAuth || !pinAuth) {
        trx.rollback()
        return undefined
      }

      // Drizzle does apperently not convert locationIDs to a string
      // despite its type being string[]
      // so we do it manually and typescript does not like that
      // @ts-ignore
      userLinkData.locationIDs = (userLinkData.locationIDs as string).split(',')

      for (let i = 0; i < userLinkData.locationIDs.length; i++) {
        await location.createAccess({
          locationID: userLinkData.locationIDs[i],
          userID: newUser.id,
          isPrimary: i == 0 ? true : false,
          customerID: userLinkData.customerID
        }, trx)
      }

      return newUser
    })

    return transaction
  },
  createUserLink: async function(userLinkData: Omit<NewUserLink, 'id'>): Promise<UserActivationLink | undefined> {
    const id = generateIdFromEntropySize(16)
    await user.deleteUserLinkByEmail(userLinkData.email)
    const newUserLink = await user.createUserLink({ ...userLinkData, id: id })
    if (!newUserLink) return undefined
    return `${ACTIVATION_LINK_BASEURL}/invitering/${newUserLink.id}`
  },
  getInviteLinkByID: async function(linkID: UserLinkID): Promise<UserLink | undefined> {
    return await user.getUserLinkByID(linkID)
  },
  validateUserLink: function(insertedDate: Date): boolean {
    return isLinkExpired(insertedDate, LINK_DURATION_HOURS)
  },
  deleteUserLink: async function(linkID: UserLinkID): Promise<boolean> {
    return await user.deleteUserLink(linkID)
  },
  toggleUserStatusByID: async function(userID: UserID): Promise<boolean> {
    return await user.toggleStatus(userID)
  },
  updateStatus: async function(
    userID: UserID,
    isActive: boolean
  ): Promise<UserNoHash | undefined> {
    const updatedUser = await user.updateByID(userID, {
      isActive
    })
    if (!updatedUser) {
      return undefined
    }
    return userDTO(updatedUser)
  },
  getByIDs: async function(
    userIDs: UserID[]
  ): Promise<UserNoHash[]> {
    return await user.getByIDs(userIDs)
  },
  registerNfcProvider: async function(
    tagID: string,
    userID: UserID,
  ): Promise<NfcAuthProvider | undefined> {
    const res = await user.createAuthProvider({
      authID: tagID,
      userID: userID,
      domain: 'nfc',
    })

    if (!authProviderIsDomain(res, 'nfc')) {
      return undefined
    }

    return res
  },
  updateNfcProvider: async function(
    tagID: string,
    userID: UserID,
  ): Promise<NfcAuthProvider | undefined> {
    return await user.updateAuthProvider(userID, 'nfc', tagID)
  },
  getNfcProvider: async function(userID: UserID): Promise<NfcAuthProvider | undefined> {
    return await user.getAuthProviderByDomain(userID, 'nfc')
  },
  getAllInfoByCustomerID: async function(customerID: CustomerID): Promise<UserInfo[]> {
    const users = await user.getAllInfoByCustomerID(customerID)
    return users.map(u => {
      const {nfcProvider, ...rest} = u
      return {
        ...rest,
        hasNfc: nfcProvider != null,
      }
    })
  },
  getUserInfoByUserID: async function(userID: UserID): Promise<UserInfo | undefined> {
    const userInfo = await user.getUserInfoByUserID(userID)
    if (userInfo == undefined) {
      return undefined
    }

    const {nfcProvider, ...rest} = userInfo

    return {
      ...rest,
      hasNfc: nfcProvider != null
    }
  },
  getNfcUser: async function(tagID: string): Promise<UserNoHash | undefined> {
    const ap = await user.getAuthProviderWithUser(tagID, "nfc")

    if (ap == undefined) return undefined

    return ap.user
  },
  getAll: async function(): Promise<UserNoHashWithCompany[]> {
    return user.getAllAndInvites()
  }
}

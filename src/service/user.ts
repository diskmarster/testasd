import { user } from '@/data/user'
import {
  NewUser,
  NewUserLink,
  PartialUser,
  User,
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
    const newUser = await user.create(userData)
    if (!newUser) return undefined
    return userDTO(newUser)
  },
  verifyPassword: async function(
    email: string,
    password: string,
  ): Promise<UserNoHash | undefined> {
    const existingUser = await user.getByEmail(email)
    if (!existingUser) return undefined
    const isValid = await verifyPassword(existingUser.hash, password)
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
    if (!existingUser.pin) {
      return undefined
    }
    const isValidPin = await verifyPassword(existingUser.pin, pin)
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
    const updatedUser = await user.updateByID(userID, { hash: hashedPassword })
    if (!updatedUser) return undefined
    return userDTO(updatedUser)
  },

  updatePin: async function(
    userID: UserID,
    newPin: string,
  ): Promise<UserNoHash | undefined> {
    const hashedPin = await hashPassword(newPin)
    const updatedUser = await user.updateByID(userID, {
      pin: hashedPin,
    })
    if (!updatedUser) {
      return undefined
    }
    return userDTO(updatedUser)
  },

  deleteByID: async function(userID: UserID): Promise<boolean> {
    return user.deleteByID(userID)
  },
  getAllByCustomerID: async function(customerID: CustomerID): Promise<UserNoHash[]> {
    const users = await user.getAllByCustomerID(customerID)
    return users.map(u => userDTO(u))
  },
  createInvitedUser: async function(userLinkData: UserLink, newUserData: NewUser): Promise<User | undefined> {
    const transaction = await db.transaction(async trx => {
      const hashed = await hashPassword(newUserData.hash)
      newUserData.hash = hashed
      const hashedPin = await hashPassword(newUserData.pin)
      newUserData.pin = hashedPin
      const newUser = await user.create(newUserData, trx)
      if (!newUser) return undefined

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
  }
}

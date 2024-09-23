import { user } from '@/data/user'
import {
  NewUser,
  PartialUser,
  UserID,
  UserNoHash,
} from '@/lib/database/schema/auth'
import {
  hashPassword,
  hashPin,
  userDTO,
  verifyPassword,
  verifyPin,
} from './user.utils'

export const userService = {
  register: async function (
    userData: NewUser,
  ): Promise<UserNoHash | undefined> {
    const hashed = await hashPassword(userData.hash)
    userData.hash = hashed
    const newUser = await user.create(userData)
    if (!newUser) return undefined
    return userDTO(newUser)
  },
  verifyPassword: async function (
    email: string,
    password: string,
  ): Promise<UserNoHash | undefined> {
    const existingUser = await user.getByEmail(email)
    if (!existingUser) return undefined
    const isValid = await verifyPassword(existingUser.hash, password)
    if (!isValid) return undefined
    return userDTO(existingUser)
  },
  verifyPin: async function (
    email: string,
    pin: string,
  ): Promise<UserNoHash | undefined> {
    const existingUser = await user.getByEmail(email)
    if (!existingUser) return undefined
    const isValid = await verifyPin(existingUser.hash, pin)
    if (!isValid) return undefined
    return userDTO(existingUser)
  },
  getByID: async function (userID: UserID): Promise<UserNoHash | undefined> {
    const existingUser = await user.getByID(userID)
    if (!existingUser) return undefined
    return userDTO(existingUser)
  },
  getByEmail: async function (
    userEmail: string,
  ): Promise<UserNoHash | undefined> {
    const existingUser = await user.getByEmail(userEmail)
    if (!existingUser) return undefined
    return userDTO(existingUser)
  },
  updateByID: async function (
    userID: UserID,
    updatedData: PartialUser,
  ): Promise<UserNoHash | undefined> {
    const updatedUser = await user.updateByID(userID, updatedData)
    if (!updatedUser) return undefined
    return userDTO(updatedUser)
  },
  updatePassword: async function (
    userID: UserID,
    newPassword: string,
  ): Promise<UserNoHash | undefined> {
    const hashedPassword = await hashPassword(newPassword)
    const updatedUser = await user.updateByID(userID, { hash: hashedPassword })
    if (!updatedUser) return undefined
    return userDTO(updatedUser)
  },

  updatePin: async function (
    userID: UserID,
    newPin: string,
  ): Promise<UserNoHash | undefined> {
    const hashedPin = await hashPin(newPin)
    const updatedPin = await user.updateByID(userID, {
      hash: hashedPin,
    })
    if (!updatedPin) return undefined
    return userDTO(updatedPin)
  },

  deleteByID: async function (userID: UserID): Promise<boolean> {
    return user.deleteByID(userID)
  },
}

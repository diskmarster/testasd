import { user } from "@/data/user"
import { NewUser, UserNoHash } from "@/lib/database/schema/auth"
import { hashPassword, userDTO, verifyPassword } from "./user.utils"

export const userService = {
  register: async function(u: NewUser): Promise<UserNoHash> {
    const hashed = await hashPassword(u.hash)
    u.hash = hashed
    const newUser = await user.create(u)
    return userDTO(newUser)
  },
  signIn: async function(email: string, password: string): Promise<UserNoHash | undefined> {
    const existingUser = await user.getByEmail(email)
    if (!existingUser) return undefined
    const isValid = await verifyPassword(existingUser.hash, password)
    if (!isValid) return undefined
    return userDTO(existingUser)
  },
  getByID: async function(userID: number): Promise<UserNoHash | undefined> {
    const u = await user.getByID(userID)
    if (!u) return undefined
    return userDTO(u)
  },
  getByEmail: async function(userEmail: string): Promise<UserNoHash | undefined> {
    const u = await user.getByEmail(userEmail)
    if (!u) return undefined
    return userDTO(u)
  }
}

import { users } from "@/data/user"
import { NewUser, UserNoHash } from "@/lib/database/schema/auth"
import { hashPassword } from "./user.utils"

export const userService = {
  register: async function(u: NewUser): Promise<UserNoHash> {
    const hashed = await hashPassword(u.hash)
    u.hash = hashed

    const newUser = await users.create(u)

    return newUser
  },
  getByID: async function(userID: number): Promise<UserNoHash | undefined> {
    return await users.getByID(userID)
  },
  getByEmail: async function(userEmail: string): Promise<UserNoHash | undefined> {
    return await users.getByEmail(userEmail)
  }
}

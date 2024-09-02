import { db } from "@/lib/database";
import { NewUser, PartialUser, User, UserID, userTable } from "@/lib/database/schema/auth";
import { eq } from "drizzle-orm";

export const user = {
  create: async function(newUser: NewUser): Promise<User> {
    const [user] = await db.insert(userTable).values(newUser).returning()
    return user
  },
  getByID: async function(userID: UserID): Promise<User | undefined> {
    const [user] = await db.select().from(userTable).where(eq(userTable.id, userID)).limit(1)
    return user
  },
  getByEmail: async function(userEmail: string): Promise<User | undefined> {
    const [user] = await db.select().from(userTable).where(eq(userTable.email, userEmail)).limit(1)
    return user
  },
  updateByID: async function(userID: UserID, updatedUser: PartialUser): Promise<User | undefined> {
    const [user] = await db.update(userTable).set({ ...updatedUser }).where(eq(userTable.id, userID)).returning()
    return user
  },
  deleteByID: async function(userID: UserID): Promise<boolean> {
    const resultSet = await db.delete(userTable).where(eq(userTable.id, userID))
    return resultSet.rowsAffected == 1
  }
}

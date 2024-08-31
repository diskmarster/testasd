import { db } from "@/lib/database";
import { NewUser, User, userTable } from "@/lib/database/schema/auth";
import { eq } from "drizzle-orm";

export const user = {
  create: async function(u: NewUser): Promise<User> {
    const [user] = await db.insert(userTable).values(u).returning()
    return user
  },
  getByID: async function(userID: number): Promise<User | undefined> {
    const [user] = await db.select().from(userTable).where(eq(userTable.id, userID)).limit(1)
    return user
  },
  getByEmail: async function(userEmail: string): Promise<User | undefined> {
    const [user] = await db.select().from(userTable).where(eq(userTable.email, userEmail)).limit(1)
    return user
  }
}

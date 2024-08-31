import { db } from "@/lib/database";
import { NewUser, UserNoHash, userTable } from "@/lib/database/schema/auth";
import { eq, getTableColumns } from "drizzle-orm";

const { hash, ...rest } = getTableColumns(userTable)

export const users = {
  create: async function(u: NewUser): Promise<UserNoHash> {
    const [user] = await db.insert(userTable).values(u).returning(rest)
    return user
  },
  getByID: async function(userID: number): Promise<UserNoHash | undefined> {
    const [user] = await db.select(rest).from(userTable).where(eq(userTable.id, userID)).limit(1)
    return user
  },
  getByEmail: async function(userEmail: string): Promise<UserNoHash | undefined> {
    const [user] = await db.select(rest).from(userTable).where(eq(userTable.email, userEmail)).limit(1)
    return user
  }
}

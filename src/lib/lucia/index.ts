import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia, TimeSpan } from "lucia";
import { db } from "@/lib/database";
import { sessionTable, userTable } from "@/lib/database/schema/auth";
import { UserRole } from "@/data/user.types";

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: 'nl_session',
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production'
    }
  },
  sessionExpiresIn: new TimeSpan(24, 'h'),
  getUserAttributes: (u: SessionUser) => {
    return {
      // define attributes for session
      name: u.name,
      email: u.email,
      role: u.role,
      clientID: u.clientID,
      isActive: u.isActive,
      inserted: u.inserted,
      updated: u.updated
    }
  }
})

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia
    UserId: number
    DatabaseUserAttributes: SessionUser
  }
}

interface SessionUser {
  name: string
  email: string
  role: UserRole
  clientID: number
  isActive: boolean
  inserted: Date
  updated: Date
}


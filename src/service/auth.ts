import { lucia } from "@/lib/lucia";
import { cookies } from "next/headers";

export const authService = {
  createSession: async function(userID: number): Promise<string> {
    const session = await lucia.createSession(userID, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    return session.id
  }
}

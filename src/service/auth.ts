import { lucia } from "@/lib/lucia";
import { Session, User } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";

export const sessionService = {
  create: async function(userID: number): Promise<string> {
    const session = await lucia.createSession(userID, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
    return session.id
  },
  validate: cache(
    async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
      const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
      if (!sessionId) {
        return {
          user: null,
          session: null
        };
      }

      const result = await lucia.validateSession(sessionId);
      // next.js throws when you attempt to set cookie when rendering page
      try {
        if (result.session && result.session.fresh) {
          const sessionCookie = lucia.createSessionCookie(result.session.id);
          cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        }
        if (!result.session) {
          const sessionCookie = lucia.createBlankSessionCookie();
          cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        }
      } catch { }
      return result;
    }
  )
}

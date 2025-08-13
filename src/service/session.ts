import { UserID } from '@/lib/database/schema/auth'
import { Customer } from '@/lib/database/schema/customer'
import { lucia } from '@/lib/lucia'
import { Session, User } from 'lucia'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { customerService } from './customer'

export const sessionService = {
	create: async function (userID: number): Promise<string> {
		const session = await lucia.createSession(userID, {})
		const sessionCookie = lucia.createSessionCookie(session.id)
		cookies().set(
			sessionCookie.name,
			sessionCookie.value,
			sessionCookie.attributes,
		)
		return session.id
	},
	validate: cache(async function (): Promise<
		| { user: User; session: Session; customer: Customer }
		| { user: null; session: null; customer: null }
	> {
		const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null
		if (!sessionId) {
			return {
				user: null,
				customer: null,
				session: null,
			}
		}

		const result = await lucia.validateSession(sessionId)
		if (!result.user || !result.session) {
			return {
				user: null,
				customer: null,
				session: null,
			}
		}

		// next.js throws when you attempt to set cookie when rendering page
		try {
			if (result.session.fresh) {
				const sessionCookie = lucia.createSessionCookie(result.session.id)
				cookies().set(
					sessionCookie.name,
					sessionCookie.value,
					sessionCookie.attributes,
				)
			}
		} catch {}

		const customer =
			(await customerService.getByID(result.user.customerID)) ?? null
		if (!customer) {
			return {
				user: null,
				customer: null,
				session: null,
			}
		}

		return {
			user: result.user,
			session: result.session,
			customer: customer,
		}
	}),
	validateSessionId: async function (
		sessionId: string,
	): Promise<{ user: User; session: Session } | { user: null; session: null }> {
		try {
			return await lucia.validateSession(sessionId)
		} catch (e) {
			console.error(
				`Error validation session id '${sessionId}': '${(e as Error).message}'`,
			)
			return {
				session: null,
				user: null,
			}
		}
	},
	delete: async function (sessionID: string): Promise<void> {
		await lucia.invalidateSession(sessionID)
		const blankCookie = lucia.createBlankSessionCookie()
		cookies().set(blankCookie.name, blankCookie.value, blankCookie.attributes)
	},
	invalidateByID: async function (userID: UserID): Promise<void> {
		await lucia.invalidateUserSessions(userID)
	},
}

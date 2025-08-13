import { UserNoHash } from '@/lib/database/schema/auth'
import { Column, sql } from 'drizzle-orm'
import { z } from 'zod'
import { Plan, plans } from './customer.types'

export const userRoleZodSchema = z.enum([
	'læseadgang',
	'afgang',
	'bruger',
	'moderator',
	'administrator',
	'system_administrator',
])
export type UserRole = z.infer<typeof userRoleZodSchema>
export const userRoles = userRoleZodSchema.options as readonly UserRole[]

export type UserInfo = UserNoHash & {
	hasNfc: boolean
}

export const resetPasswordTypeSchema = z.enum(['pw', 'pin'])

export type ResetPasswordType = z.infer<typeof resetPasswordTypeSchema>
export const resetPasswordTypes =
	resetPasswordTypeSchema.options as readonly ResetPasswordType[]

export const authProviderDomainSchema = z.enum(['pw', 'pin', 'nfc'])
export type AuthProviderDomain = z.infer<typeof authProviderDomainSchema>
export const AuthProviderDomains =
	authProviderDomainSchema.options as readonly AuthProviderDomain[]
export type UserNoHashWithCompany = Omit<
	UserNoHash,
	'id' | 'isActive' | 'updated' | 'inserted'
> & {
	id: number | null
	isActive: boolean | null
	company: string
	updated: number | '-'
	inserted: number
}

export function inList<TCol extends Column>(col: TCol, list: unknown[]) {
	return sql`${col} in (${sql.raw(list.join(', '))})`
}

export function hasPermissionByRank(
	userRole: UserRole,
	requiredRole: UserRole,
): boolean {
	const userRank = userRoles.indexOf(userRole)
	const requiredRank = userRoles.indexOf(requiredRole)

	return userRank >= requiredRank
}

export function hasPermissionByPlan(
	customerPlan: Plan,
	requiredPlan: Plan,
): boolean {
	const customerRank = plans.indexOf(customerPlan)
	const requiredRank = plans.indexOf(requiredPlan)

	return customerRank >= requiredRank
}

export type UserRoleFilter = {
	op: 'lt' | 'lte' | 'eq' | 'gt' | 'gte'
	role: UserRole
}

type FilterFn<T> = (val: T) => boolean
type UserRoleFilterFn = FilterFn<UserRole>

export function getUserRoles(filter?: UserRoleFilter): UserRole[] {
	if (!filter) {
		return userRoles as UserRole[]
	}

	return userRoles.filter(getUserRoleFilterFn(filter))
}

export function lt(role: UserRole): UserRoleFilter {
	return {
		op: 'lt',
		role,
	}
}

export function lte(role: UserRole): UserRoleFilter {
	return {
		op: 'lte',
		role,
	}
}

export function eq(role: UserRole): UserRoleFilter {
	return {
		op: 'eq',
		role,
	}
}

export function gt(role: UserRole): UserRoleFilter {
	return {
		op: 'gt',
		role,
	}
}

export function gte(role: UserRole): UserRoleFilter {
	return {
		op: 'gte',
		role,
	}
}

function getUserRoleFilterFn(filter: UserRoleFilter): UserRoleFilterFn {
	const requiredRank = userRoles.indexOf(filter.role)

	switch (filter.op) {
		case 'lt':
			return (val: UserRole) => {
				const userRank = userRoles.indexOf(val)

				return userRank < requiredRank
			}
		case 'lte':
			return (val: UserRole) => {
				const userRank = userRoles.indexOf(val)

				return userRank <= requiredRank
			}
		case 'gt':
			return (val: UserRole) => {
				const userRank = userRoles.indexOf(val)

				return userRank > requiredRank
			}
		case 'gte':
			return (val: UserRole) => {
				const userRank = userRoles.indexOf(val)

				return userRank >= requiredRank
			}
		case 'eq':
			return (val: UserRole) => {
				const userRank = userRoles.indexOf(val)

				return userRank == requiredRank
			}

		default:
			return () => true
	}
}

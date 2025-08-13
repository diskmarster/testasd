import { Plan } from '@/data/customer.types'
import {
	hasPermissionByPlan,
	hasPermissionByRank,
	UserRole,
} from '@/data/user.types'
import { Customer } from '@/lib/database/schema/customer'
import { sessionService } from '@/service/session'
import { User } from 'lucia'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'

export type WithAuthProps = {
	user: User
	customer: Customer
	pathname: string
}

export function withAuth<P extends WithAuthProps>(
	WrappedComponent: React.ComponentType<P>,
	requiredPlan?: Plan,
	requiredRole?: UserRole,
) {
	return async function AuthenticatedComponent(
		props: Omit<P, keyof WithAuthProps>,
	) {
		const { user, customer } = await sessionService.validate()
		const pathname = headers().get('x-current-path')

		if (!user) {
			redirect(`/log-ind?redirect=${pathname}`)
		}

		if (requiredPlan && !hasPermissionByPlan(customer.plan, requiredPlan)) {
			redirect('/oversigt')
		}

		if (requiredRole && !hasPermissionByRank(user.role, requiredRole)) {
			redirect('/oversigt')
		}

		return (
			<WrappedComponent
				{...(props as P)}
				user={user}
				customer={customer}
				pathname={pathname}
			/>
		)
	}
}

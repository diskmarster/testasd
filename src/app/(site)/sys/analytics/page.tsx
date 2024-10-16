import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { ActiveUsersChartContainer } from '@/components/analytics/active-users-chart-container'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { customerService } from '@/service/customer'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function Page() {
	const { session, user } = await sessionService.validate()
	if (!session) redirect('/login')

	if (user.role != 'sys_admin') return signOutAction()
	const location = await locationService.getLastVisited(user.id!)
	if (!location) return signOutAction()
	const customer = await customerService.getByID(user.customerID)
	if (!customer) return signOutAction()

	return (
		<SiteWrapper>
			<ActiveUsersChartContainer />
		</SiteWrapper>
	)
}

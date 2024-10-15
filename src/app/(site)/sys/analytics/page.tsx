import { signOutAction } from "@/app/(auth)/log-ud/actions"
import { analyticsService } from "@/service/analytics"
import { customerService } from "@/service/customer"
import { locationService } from "@/service/location"
import { sessionService } from "@/service/session"
import { redirect } from "next/navigation"
import { SiteWrapper } from "@/components/common/site-wrapper"
import { DailyActiveUsersChart } from "@/components/analytics/daily-users-chart"


export default async function Page() {
	const { session, user } = await sessionService.validate()
	if (!session) redirect('/login')

	if (user.role != 'sys_admin') return signOutAction()
	const location = await locationService.getLastVisited(user.id!)
	if (!location) return signOutAction()
	const customer = await customerService.getByID(user.customerID)
	if (!customer) return signOutAction()

	const sevenDays = await analyticsService.getActiveUsers()
	const fourWeeks = await analyticsService.getActiveUsers({ weeks: 3 }, undefined, 'week')
	const sixMonth = await analyticsService.getActiveUsers({ months: 5 }, undefined, 'month')

	return (
		<SiteWrapper>
			<div className="w-full max-h-[450px] grid grid-cols-3 gap-2">
				<DailyActiveUsersChart data={sevenDays} />
				<DailyActiveUsersChart data={fourWeeks} />
				<DailyActiveUsersChart data={sixMonth} />
			</div>
		</SiteWrapper>
	)
}

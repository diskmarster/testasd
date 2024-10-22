import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { ActiveUsersChartContainer } from '@/components/analytics/active-users-chart-container'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { hasPermissionByRank } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) redirect('/login')

  if (!hasPermissionByRank(user.role, 'system_administrator')) {
    redirect("/oversigt")
  }
  const location = await locationService.getLastVisited(user.id!)
  if (!location) {
    signOutAction()
    return
  }
  const customer = await customerService.getByID(user.customerID)
  if (!customer) {
    signOutAction()
    return
  }

  return (
    <SiteWrapper>
      <ActiveUsersChartContainer />
    </SiteWrapper>
  )
}

import { ActiveUsersChartContainer } from '@/components/analytics/active-users-chart-container'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'

interface Props extends WithAuthProps {}

async function Page(_: Props) {
  return (
    <SiteWrapper>
      <ActiveUsersChartContainer />
    </SiteWrapper>
  )
}

export default withAuth(Page, undefined, 'system_administrator')

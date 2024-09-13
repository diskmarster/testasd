import { SiteWrapper } from '@/components/common/site-wrapper'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) redirect('/log-ind')
  const history = await inventoryService.getHistoryByCustomerID(user.customerID)
  return (
    <SiteWrapper
      title='Historik'
      description='Se en oversigt over alle dine vare bevægelser'>
      <pre>{JSON.stringify(history, null, 2)}</pre>
    </SiteWrapper>
  )
}

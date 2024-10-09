import { SiteWrapper } from '@/components/common/site-wrapper'
import { TableHistory } from '@/components/inventory/table-history'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function Page({ params: { lng } }: {
  params: {
    lng: string;
  };
}) {
  const { session, user } = await sessionService.validate()
  if (!session) redirect('/log-ind')

  const location = await locationService.getLastVisited(user.id!)
  if (!location) redirect('/log-ind')

  const history = await inventoryService.getHistoryByLocationID(location)
  const customer = await customerService.getByID(user.customerID)
  if (!customer) redirect('/log-ind')

  const units = await inventoryService.getActiveUnits()
  const groups = await inventoryService.getActiveGroupsByID(customer.id)
  const placements = await inventoryService.getActivePlacementsByID(location)
  const batches = await inventoryService.getActiveBatchesByID(location)

  return (
    <SiteWrapper
      title='Historik'
      description='Se en oversigt over alle dine vare bevægelser'>
      <TableHistory
        data={history}
        user={user}
        plan={customer.plan}
        units={units}
        groups={groups}
        placements={placements}
        batches={batches}
      />
    </SiteWrapper>
  )
}

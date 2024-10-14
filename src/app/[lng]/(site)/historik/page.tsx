import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { TableHistory } from '@/components/inventory/table-history'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function Page({
  params: { lng },
}: {
  params: {
    lng: string
  }
}) {
  const { session, user } = await sessionService.validate()
  if (!session) redirect(`/${lng}/log-ind`)

  const location = await locationService.getLastVisited(user.id!)
  if (!location) redirect(`/${lng}/log-ind`)

  const history = await inventoryService.getHistoryByLocationID(location)
  const customer = await customerService.getByID(user.customerID)
  if (!customer) redirect(`/${lng}/log-ind`)

  const units = await inventoryService.getActiveUnits()
  const groups = await inventoryService.getActiveGroupsByID(customer.id)
  const placements = await inventoryService.getActivePlacementsByID(location)
  const batches = await inventoryService.getActiveBatchesByID(location)
  const { t } = await serverTranslation(lng, 'historik')

  return (
    <SiteWrapper title={t('page.title')} description={t('page.description')}>
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

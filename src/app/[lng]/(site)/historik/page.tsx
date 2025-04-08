import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { TableHistory } from '@/components/inventory/table-history'
import { CustomerSettings } from '@/lib/database/schema/customer'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { redirect } from 'next/navigation'

interface Props extends WithAuthProps {
  params: {
    lng: string
  }
}

async function Page({
  params: { lng },
  user,
  customer,
}: Props) {
  const location = await locationService.getLastVisited(user.id!)
  if (!location) redirect(`/${lng}/log-ind`)

  const history = await inventoryService.getHistoryByLocationID(location)

  const units = await inventoryService.getActiveUnits()
  const groups = await inventoryService.getActiveGroupsByID(customer.id)
  const placements = await inventoryService.getActivePlacementsByID(location)
  const batches = await inventoryService.getActiveBatchesByID(location)
  const { t } = await serverTranslation(lng, 'historik')
  const settings: CustomerSettings = await customerService.getSettings(customer.id) ?? {
    id: -1,
    customerID: customer.id,
    useReference: {
      tilgang: false,
      afgang: false,
      regulering: false,
      flyt: false,
    },
    usePlacement: false,
    useBatch: false,
    inserted: new Date(),
    updated: new Date(),
  }

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
        customerSettings={settings}
      />
    </SiteWrapper>
  )
}

export default withAuth(Page)

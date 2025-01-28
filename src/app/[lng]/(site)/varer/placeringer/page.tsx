import { serverTranslation } from '@/app/i18n'
import { ModalShowPlacementLabel } from '@/components/admin/modal-show-placement-label'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalCreatePlacement } from '@/components/inventory/modal-create-placement'
import { TablePlacement } from '@/components/inventory/table-placements'
import { hasPermissionByRank } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

interface PageProps {
  params: {
    lng: string
  }
}

export default async function Page({ params: { lng } }: PageProps) {
  const { session, user } = await sessionService.validate()
  if (!session) redirect(`/${lng}/log-ind`)

  if (!hasPermissionByRank(user.role, 'moderator')) {
    redirect('/oversigt')
  }

  const location = await locationService.getLastVisited(user.id!)
  if (!location) redirect(`/${lng}/log-ind`)

  const customer = await customerService.getByID(user.customerID)
  if (!customer) redirect(`/${lng}/log-ind`)

  const allPlacement = await inventoryService.getAllPlacementsByID(location)
  const { t } = await serverTranslation(lng, 'placeringer')

  return (
    <SiteWrapper
      title={t('placement-page.title')}
      description={t('placement-page.description')}
      actions={
        <>
          <ModalCreatePlacement />
        </>
      }>
      <TablePlacement data={allPlacement} user={user} />

      <ModalShowPlacementLabel />
    </SiteWrapper>
  )
}

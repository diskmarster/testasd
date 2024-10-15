import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalCreateUnit } from '@/components/inventory/modal-create-unit'
import { UnitOverview } from '@/components/inventory/table-units'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'

interface pageprops {
  params: {
    lng: string
  }
}

export default async function Page({ params: { lng } }: pageprops) {
  const { session, user } = await sessionService.validate()
  if (!session) return signOutAction()
  const location = await locationService.getLastVisited(user.id!)
  if (!location) return signOutAction()
  const customer = await customerService.getByID(user.customerID)
  if (!customer) return signOutAction()
  const units = await inventoryService.getAllUnits()
  const { t } = await serverTranslation(lng, 'enheder')

  return (
    <SiteWrapper
      title={t('unit-page.unit-title')}
      description={t('unit-page.unit-description')}
      actions={
        <>
          <ModalCreateUnit />
        </>
      }>
      <UnitOverview units={units} user={user} />
    </SiteWrapper>
  )
}

import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalCreateUnit } from '@/components/inventory/modal-create-unit'
import { UnitOverview } from '@/components/inventory/table-units'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) return signOutAction()
  const location = await locationService.getLastVisited(user.id!)
  if (!location) return signOutAction()
  const customer = await customerService.getByID(user.customerID)
  if (!customer) return signOutAction()
  const units = await inventoryService.getAllUnits()

  return (
    <SiteWrapper
      title='Enheder'
      description='Se en oversigt over alle Enhederne'
      actions={
        <>
          <ModalCreateUnit />
        </>
      }>
      <UnitOverview units={units} user={user} />
    </SiteWrapper>
  )
}

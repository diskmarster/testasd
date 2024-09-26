import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalCreateUnitForm } from '@/components/inventory/modal-create-unit'
import { UnitOverview } from '@/components/inventory/table-units'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'
export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) redirect('/log-ind')
  const location = await locationService.getLastVisited(user.id!)
  if (!location) redirect('/log-ind')
  const customer = await customerService.getByID(user.customerID)
  if (!customer) redirect('/log-ind')
  const units = await inventoryService.getAllUnits()
  return (
    <SiteWrapper
      title='Enheder'
      description='Se en oversigt over alle Enhederne'
      actions={
        <>
          <ModalCreateUnitForm />
        </>
      }>
      <UnitOverview units={units} user={user} />
    </SiteWrapper>
  )
}
